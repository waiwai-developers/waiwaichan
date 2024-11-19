import "./routes/discordjs/replyRemaind.js";
import config from "@/config.json" with { type: "json" };
import type { IReminderSchedulerRepository } from "@/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import { ReminderSchedulerRepositoryImpl } from "@/repositories/sequelize-mysql/";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import cron from "node-cron";

const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce(
		(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
		0,
	),
});
cron.schedule("* * * * *", async () => {
	try {
		const reminder: IReminderSchedulerRepository =
			new ReminderSchedulerRepositoryImpl();
		const remainders = await reminder.findByRemindTime();

		if (remainders.length === 0) return;

		for (const remainder of remainders) {
			const channel = client.channels.cache.get(remainder.channelId.getValue());
			if (channel != null && channel instanceof TextChannel) {
				await channel.send(`<@${remainder.userId}>\n${remainder.message}`);
			}
			await reminder.deleteReminder(remainder.id);
		}
	} catch (e) {
		console.error("Error:", e);
	}
});

(async () => {
	await client.login(config.discord.token);
})();
