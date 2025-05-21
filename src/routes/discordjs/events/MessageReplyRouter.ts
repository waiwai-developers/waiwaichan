import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, Message } from "discord.js";
import { inject, injectable, multiInject } from "inversify";

@injectable()
export class MessageReplyRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@multiInject(HandlerTypes.MessageHandler)
	handler: DiscordEventHandler<Message>[] = [];
	register(client: Client): void {
		client.on("messageCreate", async (message) => {
			try {
				this.logger.debug(`Message received  Message:${message}`);
				await Promise.all(this.handler.map((h) => h.handle(message)));
			} catch (error) {
				this.logger.error(`Error: ${error}`);
			}
		});
	}
}
