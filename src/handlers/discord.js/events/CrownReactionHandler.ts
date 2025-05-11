import { AppConfig } from "@/src/entities/config/AppConfig";
import { APPLY_CROWN_NUM } from "@/src/entities/constants/Crown";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CrownDto } from "@/src/entities/dto/CrownDto";
import { CrownMessage } from "@/src/entities/vo/CrownMessage";
import { CrownMessageLink } from "@/src/entities/vo/CrownMessageLink";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

import type {
	DiscordEventHandler,
	ReactionInteraction,
} from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICrownLogic } from "@/src/logics/Interfaces/logics/ICrownLogic";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CrownReactionHandler
	implements DiscordEventHandler<ReactionInteraction> {
	@inject(LogicTypes.CrownLogic)
	private crownLogic!: ICrownLogic;

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

		if (reaction.message.content == null) {
			console.log("content is null");
			return;
		}

		if (reaction.count == null) {
			console.log("count is null");
			return;
		}

		if (reaction.count < APPLY_CROWN_NUM) {
			return;
		}

		if (reaction.message.guildId == null) {
			console.log("guildId is null");
			return;
		}

		const res = await this.crownLogic.createCrownIfNotExists(
			new DiscordGuildId(reaction.message.guildId),
			new DiscordUserId(reaction.message.author.id),
			new DiscordMessageId(reaction.message.id),
			new CrownMessage(reaction.message.content),
			new CrownMessageLink(reaction.message.url),
		);

		if (res == null) {
			return;
		}

		const channel = reaction.message.guild?.channels.cache.get(
			AppConfig.backend.crownLogChannel,
		);

		if (!(channel instanceof TextChannel)) {
			return;
		}
		await channel.send(res);
	}
}
