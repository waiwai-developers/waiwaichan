import "reflect-metadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import {
	RepoTypes,
	SchedulerRepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import { schedulerContainer } from "@/src/scheduler.di.config";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import cron from "node-cron";

const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce(
		(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
		0,
	),
});

const reminderNotifyHandler = async () => {
	try {
		const t = schedulerContainer.get<ITransaction<TransactionLike>>(
			RepoTypes.Transaction,
		);
		await t.startTransaction(async (_t) => {
			const reminder = schedulerContainer.get<IReminderSchedulerRepository>(
				SchedulerRepoTypes.ReminderSchedulerRepository,
			);
			const remainders = await reminder.findByRemindTime();

			if (remainders.length === 0) return;

		for (const remainder of remainders) {
			const channel = client.channels.cache.get(remainder.channelId.getValue());
			if (channel != null && channel instanceof TextChannel) {
				await channel.send(
					`${remainder.receiveUserName.getValue()}\n${remainder.message.getValue()}`,
				);
			}
			await reminder.deleteReminder(remainder.id);
		}
	} catch (e) {
		console.error("Error:", e);
	}
};

cron.schedule("* * * * *", reminderNotifyHandler);
await client.login(AppConfig.discord.token);
