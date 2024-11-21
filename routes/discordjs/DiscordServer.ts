import { appContainer } from "@/di.config";
import { RouteTypes } from "@/entities/constants/DIContainerTypes";
import { DiscordCommandRegister } from "@/routes/discordjs/DiscordCommandRegister";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import type { DiscordEventRouter } from "./events/DiscordEventRouter";

export class DiscordServer {
	client: Client;
	EventRoutes: DiscordEventRouter[];
	constructor() {
		this.client = new Client({
			intents: Object.values(GatewayIntentBits).reduce(
				(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
				0,
			),
			partials: [Partials.Message, Partials.Reaction, Partials.Channel],
		});

		this.EventRoutes = [
			appContainer.get<DiscordEventRouter>(RouteTypes.ReadyStateRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.SlashCommandRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.MessageReplyRoute),
			appContainer.get<DiscordEventRouter>(RouteTypes.ReactionRoute),
		];
	}

	async start(token: string): Promise<void> {
		await new DiscordCommandRegister().register(token);
		this.EventRoutes.forEach((event) => {
			event.register(this.client);
		});
		await this.client.login(token);
	}
}
