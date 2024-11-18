import { ChatAILogic } from "@/logics/ChatAILogic";
import { MinecraftServerLogic } from "@/logics/MinecraftServerLogic";
import { PointLogic } from "@/logics/PointLogic";
import { PullRequestLogic } from "@/logics/PullRequestLogic";
import { ReminderLogic } from "@/logics/ReminderLogic";
import { TranslatorLogic } from "@/logics/TranslatorLogic";
import { UtilityLogic } from "@/logics/UtilityLogic";
import { ChatGPTRepositoryImpl } from "@/repositories/chatgptapi/ChatGPTRepositoryImpl";
import { DeepLTranslateRepositoryImpl } from "@/repositories/deeplapi/DeepLTranslateRepositoryImpl";
import { GCPComputeEngineInstanceRepositoryImpl } from "@/repositories/gcpapi/GCPComputeEngineInstanceRepositoryImpl";
import { PullRequestRepositoryImpl } from "@/repositories/githubapi/PullRequestRepositoryImpl";
import {
	PointItemRepositoryImpl,
	PointRepositoryImpl,
	ReminderRepositoryImpl,
	UserPointItemRepositoryImpl,
} from "@/repositories/sequelize-mysql";
import { SequelizeTransaction } from "@/repositories/sequelize-mysql/SequelizeTransaction";
import { DiscordCommandRegister } from "@/routes/discordjs/DiscordCommandRegister";
import { MessageReplyRouter } from "@/routes/discordjs/events/MessageReplyRouter";
import { ReactionRouter } from "@/routes/discordjs/events/ReactionRouter";
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

		// resolve DI
		// TODO resolve DI with DI Container
		const pointRepository = new PointRepositoryImpl();
		const pointItemRepository = new PointItemRepositoryImpl();
		const userPointItemRepository = new UserPointItemRepositoryImpl();
		const reminderRepository = new ReminderRepositoryImpl();

		const chatGPTRepository = new ChatGPTRepositoryImpl();
		const gcpVMRepository = new GCPComputeEngineInstanceRepositoryImpl();
		const pullRequestRepository = new PullRequestRepositoryImpl();
		const translateRepository = new DeepLTranslateRepositoryImpl();

		const utilityLogic = new UtilityLogic();
		const translatorLogic = new TranslatorLogic(translateRepository);
		const chatAILogic = new ChatAILogic(chatGPTRepository);
		const reminderLogic = new ReminderLogic(reminderRepository);
		const pointLogic = new PointLogic(
			pointRepository,
			pointItemRepository,
			userPointItemRepository,
			new SequelizeTransaction(),
		);
		const pullRequestLogic = new PullRequestLogic(pullRequestRepository);
		const minecraftServerLogic = new MinecraftServerLogic(gcpVMRepository);
		this.EventRoutes = [
			new SlashCommandRouter(
				utilityLogic,
				translatorLogic,
				chatAILogic,
				reminderLogic,
				pointLogic,
				pullRequestLogic,
				minecraftServerLogic,
			),
			new ReactionRouter(pointLogic),
			new MessageReplyRouter(chatAILogic),
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
