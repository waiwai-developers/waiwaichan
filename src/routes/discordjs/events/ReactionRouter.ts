import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type {
	DiscordEventHandler,
	ReactionInteraction,
} from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client } from "discord.js";
import { inject, injectable, multiInject } from "inversify";

@injectable()
export class ReactionRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@multiInject(HandlerTypes.ReactionHandler)
	private readonly handlers!: DiscordEventHandler<ReactionInteraction>[];
	register(client: Client): void {
		client.on("messageReactionAdd", async (reaction, user, details) => {
			try {
				this.logger.debug(
					`New reaction received Reaction:${reaction} User:${user.username}`,
				);
				await Promise.all(
					this.handlers.map((h) => h.handle({ reaction, user, details })),
				);
			} catch (e) {
				this.logger.error(`Error: ${e}`);
			}
		});
	}
}
