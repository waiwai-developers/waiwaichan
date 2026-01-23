import {
	LogicTypes,
	RepoTypes,
	SchedulerRepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { schedulerContainer } from "@/src/scheduler.di.config";
import { type Client, TextChannel } from "discord.js";

export const ReminderNotifyHandler = async (c: Client<boolean>) => {
	const t = schedulerContainer.get<ITransaction>(RepoTypes.Transaction);
	await t.startTransaction(async () => {
		const reminder = schedulerContainer.get<IReminderSchedulerRepository>(
			SchedulerRepoTypes.ReminderSchedulerRepository,
		);
		const channelLogic = schedulerContainer.get<IChannelLogic>(
			LogicTypes.ChannelLogic,
		);
		const remainders = await reminder.findByRemindTime();

		if (remainders.length === 0) return;

		for (const remainder of remainders) {
			const clientId = await channelLogic.getClientIdById(remainder.channelId);
			if (!clientId) return;
			const channel = c.channels.cache.get(clientId.getValue().toString());
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
};
