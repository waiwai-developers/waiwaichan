import "reflect-metadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ReminderNotifyHandler } from "@/src/handlers/discord.js/events/ReminderNotifyHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { MysqlSchedulerConnector } from "@/src/repositories/sequelize-mysql/MysqlSchedulerConnector";
import { schedulerContainer } from "@/src/scheduler.di.config";
import { Client, GatewayIntentBits } from "discord.js";
import cron from "node-cron";

const logger = schedulerContainer.get<ILogger>(RepoTypes.Logger);
schedulerContainer.get<MysqlSchedulerConnector>(RepoTypes.DatabaseConnector);
const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce(
		(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
		0,
	),
});

client.on("ready", (c: Client) => {
	if (c.isReady()) {
		logger.info(`login: ${c.user.tag}`);
	}
});

cron.schedule("* * * * *", () => ReminderNotifyHandler(client));
await client.login(AppConfig.discord.token);
