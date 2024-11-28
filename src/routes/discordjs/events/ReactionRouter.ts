import { HandlerTypes } from "@/src/entities/constants/DIContainerTypes";
import type {
	DiscordEventHandler,
	ReactionInteraction,
} from "@/src/handler/discord.js/events/DiscordEventHandler";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client } from "discord.js";
import { injectable, multiInject } from "inversify";

@injectable()
export class ReactionRouter implements DiscordEventRouter {
	@multiInject(HandlerTypes.ReactionHandler)
	private readonly handlers!: DiscordEventHandler<ReactionInteraction>[];
	register(client: Client): void {
		client.on("messageReactionAdd", (reaction, user, details) => {
			this.handlers.map((h) => h.handle({ reaction, user, details }));
		});
	}
}
