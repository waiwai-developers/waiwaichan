import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
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

	async handle({ reaction, user }: ReactionInteraction): Promise<void> {
		if (reaction.partial) {
			try {
				await reaction.fetch();
				await reaction.message.fetch();
				await reaction.message.guild?.channels.fetch();
			} catch (err) {
				console.log("fail to fetch old message");
				return;
			}
		}
		if (user.bot) {
			console.log("reaction by bot");
			return;
		}

		if (
			(reaction.message.author?.bot ?? true) ||
			(reaction.message.author?.id ?? null) == null
		) {
			console.log("some data is null");
			return;
		}

		if (reaction.message.author?.id == null) {
			console.log("author id is null");
			return;
		}

		if (reaction.emoji.name !== AppConfig.backend.candyEmoji) {
			console.log("not peer bonus emoji");
			return;
		}

		const res = await this.candyLogic.giveCandy(
			new DiscordUserId(reaction.message.author.id),
			new DiscordUserId(user.id),
			new DiscordMessageId(reaction.message.id),
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
