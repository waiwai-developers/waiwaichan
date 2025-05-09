import { appContainer } from "@/src/app.di.config";
import { RouteTypes } from "@/src/entities/constants/DIContainerTypes";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { DiscordServer } from "@/src/routes/discordjs/DiscordServer";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";

export class TestDiscordServer extends DiscordServer {
	private constructor() {
		new MysqlConnector();
		super();
	}
	async reRegister() {
		this.client.removeAllListeners();
		this.EventRoutes = await Promise.all([
			appContainer.get<DiscordEventRouter>(RouteTypes.ReadyStateRoute),
			appContainer.getAsync<DiscordEventRouter>(RouteTypes.SlashCommandRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.MessageReplyRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.ReactionRoute),
		]);

		this.EventRoutes.forEach((event) => {
			event.register(this.client);
		});
		return this;
	}
	static async getClient() {
		return new TestDiscordServer().reRegister().then((t) => t.client);
	}
}
