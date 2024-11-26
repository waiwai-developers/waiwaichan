import "reflect-metadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import {
	RepoTypes,
	SchedulerRepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import { ReminderSchedulerRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { MysqlSchedulerConnector } from "@/src/repositories/sequelize-mysql/MysqlSchedulerConnector";
import { SequelizeTransaction } from "@/src/repositories/sequelize-mysql/SequelizeTransaction";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { Container } from "inversify";
import cron from "node-cron";
import type { Sequelize } from "sequelize-typescript";

const schedulerContainer = new Container();
schedulerContainer
	.bind<IDataBaseConnector<Sequelize, "mysql">>(RepoTypes.DatabaseConnector)
	.to(MysqlSchedulerConnector)
	.inSingletonScope();
schedulerContainer
	.bind<ITransaction<TransactionLike>>(RepoTypes.Transaction)
	.to(SequelizeTransaction);
schedulerContainer
	.bind<IReminderSchedulerRepository>(
		SchedulerRepoTypes.ReminderSchedulerRepository,
	)
	.to(ReminderSchedulerRepositoryImpl);

const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce(
		(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
		0,
	),
});

const t = schedulerContainer.get<ITransaction<TransactionLike>>(
	RepoTypes.Transaction,
);

cron.schedule("* * * * *", async () => {
	try {
		await t.startTransaction(async (_t) => {
			const reminder = schedulerContainer.get<IReminderSchedulerRepository>(
				SchedulerRepoTypes.ReminderSchedulerRepository,
			);
			const remainders = await reminder.findByRemindTime();

			if (remainders.length === 0) return;

			for (const remainder of remainders) {
				const channel = client.channels.cache.get(
					remainder.channelId.getValue(),
				);
				if (channel != null && channel instanceof TextChannel) {
					await channel.send(
						`<@${remainder.userId.getValue()}>\n${remainder.message.getValue()}`,
					);
				}
				await reminder.deleteReminder(remainder.id);
			}
		});
	} catch (e) {
		console.error("Error:", e);
	}
});

(async () => {
	await client.login(AppConfig.discord.token);
})();
