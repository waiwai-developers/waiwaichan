import { AppConfig } from "@/src/entities/config/AppConfig";
import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type {
	DiscordEventHandler,
	ReactionInteraction,
} from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
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
		if (!reaction.message.guildId) {
			this.logger.debug("not guild message");
			return;
		}
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

		const candyCategoryType = ((ce) => {
			switch (ce) {
				case AppConfig.backend.candySuperEmoji:
					return CandyCategoryType.CATEGORY_TYPE_SUPER;
				case AppConfig.backend.candyEmoji:
					return CandyCategoryType.CATEGORY_TYPE_NORMAL;
				default:
					return undefined;
			}
		})(reaction.emoji.name);
		if (candyCategoryType == null) {
			return;
		}

		const res = await this.candyLogic.giveCandys(
			new DiscordGuildId(reaction.message.guildId),
			new DiscordUserId(reaction.message.author.id),
			new DiscordUserId(user.id),
			new DiscordMessageId(reaction.message.id),
			new DiscordMessageLink(reaction.message.url),
			candyCategoryType,
		);
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
