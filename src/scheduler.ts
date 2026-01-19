import "reflect-metadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityAndUserDeleteHandler } from "@/src/handlers/discord.js/events/CommunityAndUserDeleteHandler";
import { ReminderNotifyHandler } from "@/src/handlers/discord.js/events/ReminderNotifyHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { MysqlSchedulerConnector } from "@/src/repositories/sequelize-mysql/MysqlSchedulerConnector";
import { schedulerContainer } from "@/src/scheduler.di.config";
import { sequelizeNamespace } from "@/src/repositories/sequelize-mysql/SequelizeClsNamespace";
import { Client, GatewayIntentBits } from "discord.js";
import cron from "node-cron";

schedulerContainer.get<MysqlSchedulerConnector>(RepoTypes.DatabaseConnector);
const logger = schedulerContainer.get<ILogger>(RepoTypes.Logger);

logger.info("Scheduler initializing...");

// Discordクライアントの初期化
const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce(
		(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
		0,
	),
});

// cls-hooked名前空間内でタスクを実行するヘルパー関数
const runInNamespace = async (taskName: string, task: () => Promise<void>) => {
	try {
		logger.info(`Running ${taskName} task`);

		// cls-hooked名前空間内でタスクを実行
		sequelizeNamespace.run(async () => {
			try {
				await task();
				logger.info(`${taskName} task completed`);
			} catch (error) {
				logger.error(
					`Error in ${taskName} task: ${error instanceof Error ? error.message : String(error)}`,
				);
				if (error instanceof Error && error.stack) {
					logger.error(error.stack);
				}
			}
		});
	} catch (error) {
		logger.error(
			`Failed to run ${taskName} task in namespace: ${error instanceof Error ? error.message : String(error)}`,
		);
		if (error instanceof Error && error.stack) {
			logger.error(error.stack);
		}
	}
};

// リマインダーの実行
cron.schedule("* * * * *", () => {
	runInNamespace("reminder notification", () => ReminderNotifyHandler(client));
});

// コミュニティとユーザーの同期
cron.schedule("0 0 * * *", () => {
	runInNamespace("community and user sync", () =>
		CommunityAndUserDeleteHandler(client),
	);
});

// Discordにログイン
client
	.login(AppConfig.discord.token)
	.then(() => {
		logger.info("Discord client logged in successfully");
	})
	.catch((error) => {
		logger.error(
			`Failed to login to Discord: ${error instanceof Error ? error.message : String(error)}`,
		);
		process.exit(1);
	});

// 未処理の例外をキャッチ
process.on("uncaughtException", (error) => {
	logger.error(`Uncaught exception: ${error.message}`);
	logger.error(error.stack || "No stack trace available");
});

process.on("unhandledRejection", (reason) => {
	logger.error(
		`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`,
	);
	if (reason instanceof Error && reason.stack) {
		logger.error(reason.stack);
	}
});

logger.info("Scheduler initialized successfully");
client.on("ready", (c: Client) => {
	if (c.isReady()) {
		logger.info(`login: ${c.user.tag}`);
	}
});
