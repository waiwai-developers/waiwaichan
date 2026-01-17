import { appContainer } from "@/src/app.di.config";
import { RouteTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordCommandRegister } from "@/src/routes/discordjs/DiscordCommandRegister";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import type { DiscordEventRouter } from "./events/DiscordEventRouter";

export class DiscordServer {
	client: Client;
	EventRoutes: DiscordEventRouter[] = [];
	constructor() {
		this.client = new Client({
			intents: Object.values(GatewayIntentBits).reduce(
				(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
				0,
			),
			partials: [Partials.Message, Partials.Reaction, Partials.Channel],
		});
	}

	async start(token: string): Promise<void> {
		this.EventRoutes = await Promise.all([
			appContainer.get<DiscordEventRouter>(RouteTypes.ReadyStateRoute),
			appContainer.getAsync<DiscordEventRouter>(RouteTypes.SlashCommandRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.MessageReplyRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.ReactionRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.ActionAddBotRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.ActionRemoveBotRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.ActionAddUserRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.ActionRemoveUserRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.VoiceChannelEventRoute),
		]);
		await new DiscordCommandRegister().register(token);
		this.EventRoutes.forEach((event) => {
			event.register(this.client);
		});
		await this.client.login(token);
	}
}
