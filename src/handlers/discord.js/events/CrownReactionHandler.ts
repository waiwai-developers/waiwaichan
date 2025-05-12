import { AppConfig } from "@/src/entities/config/AppConfig";
import { APPLY_CROWN_NUM } from "@/src/entities/constants/Crown";
import {
	LogicTypes,
	RepoTypes
} from "@/src/entities/constants/DIContainerTypes";
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
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";

@injectable()
export class CrownReactionHandler
	implements DiscordEventHandler<ReactionInteraction> {
	@inject(LogicTypes.CrownLogic)
	private crownLogic!: ICrownLogic;

	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	async handle({ reaction, user }: ReactionInteraction): Promise<void> {
		if (reaction.partial) {
			try {
				await reaction.fetch();
				await reaction.message.fetch();
				await reaction.message.guild?.channels.fetch();
			} catch (err) {
				this.logger.error("fail to fetch old message");
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
			this.logger.error("some data is null");
			return;
		}

		if (reaction.message.author?.id == null) {
			this.logger.error("author id is null");
			return;
		}

		if (reaction.message.content == null) {
			this.logger.error("content is null");
			return;
		}

		if (reaction.count == null) {
			this.logger.error("count is null");
			return;
		}

		if (reaction.count < APPLY_CROWN_NUM) {
			return;
		}

		if (reaction.message.guildId == null) {
			this.logger.error("guildId is null");
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
