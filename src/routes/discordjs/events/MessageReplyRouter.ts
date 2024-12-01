import { HandlerTypes } from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, Message } from "discord.js";
import { injectable, multiInject } from "inversify";

@injectable()
export class MessageReplyRouter implements DiscordEventRouter {
	@multiInject(HandlerTypes.MessageHandler)
	handler: DiscordEventHandler<Message>[] = [];
	register(client: Client): void {
		client.on("messageCreate", (message) => {
			this.handler.forEach((h) => h.handle(message));
		});
	}
}
