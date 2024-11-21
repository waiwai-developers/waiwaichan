import { schedulerContainer } from "@/di.config";
import { AppConfig } from "@/entities/config/AppConfig";
import { SchedulerRepoTypes } from "@/entities/constants/DIContainerTypes";
import type { IReminderSchedulerRepository } from "@/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import cron from "node-cron";

const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce(
		(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
		0,
	),
});
cron.schedule("* * * * * *", async () => {
	try {
		const reminder = schedulerContainer.get<IReminderSchedulerRepository>(
			SchedulerRepoTypes.ReminderSchedulerRepository,
		);

		const remainders = await reminder.findByRemindTime();

		if (remainders.length === 0) return;

		for (const remainder of remainders) {
			const channel = client.channels.cache.get(remainder.channelId.getValue());
			if (channel != null && channel instanceof TextChannel) {
				await channel.send(
					`<@${remainder.userId.getValue()}>\n${remainder.message.getValue()}`,
				);
			}
			await reminder.deleteReminder(remainder.id);
		}
	} catch (e) {
		console.error("Error:", e);
	}
});

(async () => {
	await client.login(AppConfig.discord.token);
})();
