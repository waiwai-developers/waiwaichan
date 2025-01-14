import {
	RepoTypes,
	SchedulerRepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import { schedulerContainer } from "@/src/scheduler.di.config";
import { type Client, TextChannel } from "discord.js";

export const ReminderNotifyHandler = async (c: Client<boolean>) => {
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
				const channel = c.channels.cache.get(remainder.channelId.getValue());
				console.log(channel instanceof TextChannel);
				console.log(channel);
				if (channel != null && channel instanceof TextChannel) {
					await channel.send(
						`${remainder.receiveUserName.getValue()}\n${remainder.message.getValue()}`,
					);
				}
				if (remainder.id) {
					await reminder.deleteReminder(remainder.id);
				}
			}
		});
	} catch (e) {
		console.error("Error:", e);
	}
};
