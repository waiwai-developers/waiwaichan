import { AppConfig } from "@/entities/config/AppConfig";
import { ChatAILogicImpl } from "@/logics/ChatAILogicImpl";
import { MinecraftServerLogicImpl } from "@/logics/MinecraftServerLogicImpl";
import { PointLogicImpl } from "@/logics/PointLogicImpl";
import { PullRequestLogicImpl } from "@/logics/PullRequestLogicImpl";
import { ReminderLogicImpl } from "@/logics/ReminderLogicImpl";
import { TranslatorLogic } from "@/logics/TranslatorLogicImpl";
import { UtilityLogicImpl } from "@/logics/UtilityLogicImpl";
import { DiscordCommandRegister } from "@/routes/discordjs/DiscordCommandRegister";
import { SlashCommandRouter } from "@/routes/discordjs/events/SlashCommandRouter";
import { Client, GatewayIntentBits } from "discord.js";
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
		});
		this.EventRoutes = [
			new SlashCommandRouter(
				new UtilityLogicImpl(),
				new TranslatorLogic(),
				new ChatAILogicImpl(),
				new ReminderLogicImpl(),
				new PointLogicImpl(),
				new PullRequestLogicImpl(),
				new MinecraftServerLogicImpl(),
			),
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
