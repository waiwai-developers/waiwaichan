import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, Message, PartialMessage } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ActionRemoveMessageRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@inject(HandlerTypes.ActionRemoveMessageHandler)
	private readonly handler!: DiscordEventHandler<Message | PartialMessage>;
	register(client: Client): void {
		client.on("messageDelete", async (message) => {
			try {
				if (!message.guild) {
					return;
				}
				this.logger.info(
					`Message was deleted from server for guildId: ${message.guild.id} messageId: ${message.id}.`,
				);
				await this.handler.handle(message);
			} catch (e) {
				this.logger.error(`Error: ${e}`);
			}
		});
	}
}
