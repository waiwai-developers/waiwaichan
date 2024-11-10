import { Client, GatewayIntentBits } from "discord.js";
import Sequelize from "sequelize";
import { token } from "../../config.json";
import models from "../../models/index.js";

const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b),
});
setInterval(async () => {
	try {
		const remainders = await models.Reminder.findAll({
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
}, 10_000);
client.login(token);
