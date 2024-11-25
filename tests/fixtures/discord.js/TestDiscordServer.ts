import { appContainer } from "@/src/di.config";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { RouteTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordServer } from "@/src/routes/discordjs/DiscordServer";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";

export class TestDiscordServer extends DiscordServer {
	private static instance: TestDiscordServer;
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
	}
	static async getClient() {
		if (TestDiscordServer.instance) {
			await TestDiscordServer.instance.reRegister();
			return TestDiscordServer.instance.client;
		}
		TestDiscordServer.instance = new TestDiscordServer();
		await TestDiscordServer.instance.client.login(AppConfig.discord.token);
		return TestDiscordServer.instance.client;
	}
}
