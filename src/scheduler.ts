import "reflect-metadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ReminderNotifyHandler } from "@/src/handlers/discord.js/events/ReminderNotifyHandler";
import type { MysqlSchedulerConnector } from "@/src/repositories/sequelize-mysql/MysqlSchedulerConnector";
import { schedulerContainer } from "@/src/scheduler.di.config";
import { Client, GatewayIntentBits } from "discord.js";
import cron from "node-cron";

schedulerContainer.get<MysqlSchedulerConnector>(RepoTypes.DatabaseConnector);
const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce(
		(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
		0,
	),
});

//reminderの実行
cron.schedule("* * * * *", () => ReminderNotifyHandler(client));

//communityとuserの同期
cron.schedule("0 0 * * *", () => CommunityAndUserDeleteHandler(client));

await client.login(AppConfig.discord.token);
