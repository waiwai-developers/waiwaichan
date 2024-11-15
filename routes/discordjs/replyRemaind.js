import { Client, GatewayIntentBits } from "discord.js";
import cron from "node-cron";
import Sequelize from "sequelize";
import config from "../../config.json" with { type: "json" };
import { Reminder } from "../../models/index.js";

const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b),
});
cron.schedule("* * * * *", async () => {
	try {
		const remainders = await Reminder.findAll({
			where: { remindAt: { [Sequelize.Op.lte]: new Date() } },
		});

		if (remainders.length === 0) return;

		let channel = null;
		for (const remainder of remainders) {
			channel = client.channels.cache.get(remainder.channelId);
			if (channel) {
				await channel.send(`<@${remainder.userId}>\n${remainder.message}`);
			}
			await remainder.destroy();
		}
	} catch (e) {
		console.error("Error:", e);
	}
});
client.login(config.discord.token);
