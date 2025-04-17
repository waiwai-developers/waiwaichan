import { AppConfig } from "@/src/entities/config/AppConfig";
import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type {
	DiscordEventHandler,
	ReactionInteraction,
} from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CandyReactionHandler
	implements DiscordEventHandler<ReactionInteraction>
{
	@inject(LogicTypes.CandyLogic)
	private candyLogic!: ICandyLogic;

	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	async handle({ reaction, user }: ReactionInteraction): Promise<void> {
		if (reaction.partial) {
			try {
				await reaction.fetch();
				await reaction.message.fetch();
				await reaction.message.guild?.channels.fetch();
			} catch (err) {
				this.logger.debug("fail to fetch old message");
				return;
			}
		}
		if (user.bot) {
			this.logger.debug("reaction by bot");
			return;
		}

		if (
			(reaction.message.author?.bot ?? true) ||
			(reaction.message.author?.id ?? null) == null
		) {
			this.logger.debug("some data is null");
			return;
		}

		if (reaction.message.author?.id == null) {
			this.logger.debug("author id is null");
			return;
		}

		let res;

		if (reaction.emoji.name === AppConfig.backend.candyEmoji) {
			res = await this.candyLogic.giveCandy(
				new DiscordUserId(reaction.message.author.id),
				new DiscordUserId(user.id),
				new DiscordMessageId(reaction.message.id),
				new DiscordMessageLink(reaction.message.url),
			);
		} else if (reaction.emoji.name === AppConfig.backend.candyBigEmoji) {
			res = await this.candyLogic.giveBigCandy(
				new DiscordUserId(reaction.message.author.id),
				new DiscordUserId(user.id),
				new DiscordMessageId(reaction.message.id),
				new DiscordMessageLink(reaction.message.url),
			);
		} else {
			this.logger.debug("not peer bonus emoji");
			return;
		}

		if (!res) {
			return;
		}

		const channel = reaction.message.guild?.channels.cache.get(
			AppConfig.backend.candyLogChannel,
		);

		if (!(channel instanceof TextChannel)) {
			return;
		}
		await channel.send(res);
	}
}
