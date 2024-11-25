import { appContainer } from "@/src/di.config";
import { RouteTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordServer } from "@/src/routes/discordjs/DiscordServer";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";

export class TestDiscordServer extends DiscordServer {
	private constructor() {
		super();
		this.EventRoutes.forEach((event) => {
			event.register(this.client);
		});
	}
	async reRegister() {
		this.client.removeAllListeners();
		this.EventRoutes = [
			appContainer.get<DiscordEventRouter>(RouteTypes.ReadyStateRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.SlashCommandRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.MessageReplyRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.ReactionRoute),
		];

		this.EventRoutes.forEach((event) => {
			event.register(this.client);
		});
		return this;
	}
	static async getClient() {
		return new TestDiscordServer().reRegister().then((t) => t.client);
	}
}
