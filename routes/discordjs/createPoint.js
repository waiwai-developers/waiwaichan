import { Client, GatewayIntentBits } from "discord.js";
import config from "../../config.json" with { type: "json" };
import { Point } from "../../models/index.js";

import Sequelize from "sequelize";
const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b),
});
client.on("createPoint", () => {
	console.log(`login: ${client.user.tag}`);
});

client.on("messageReactionAdd", async (reaction, user) => {
	if (user.bot) return;
	if (reaction.message.author.bot) return;
	if (user.id === reaction.message.author.id) return;

	if (reaction.emoji.name === "🍬") {
		const date = new Date();
		const points = await Point.findAndCountAll({
			attributes: ["messageId"],
			where: {
				giveUserId: user.id,
				createdAt: { [Sequelize.Op.gte]: date.setDate(date.getDate() - 1) },
			},
		});

		if (points.rows.map((p) => p.messageId).includes(reaction.message.id))
			return;

		if (points.count > 2) {
			await reaction.message.channel.send(
				"今はスタンプを押してもポイントをあげられないよ！っ",
			);
			return;
		}

		await Point.create({
			receiveUserId: reaction.message.author.id,
			giveUserId: user.id,
			messageId: reaction.message.id,
			status: Point.STATUS_VALID,
			expiredAt: date.setMonth(date.getMonth() + 1),
		});

		await reaction.message.reply(
			`<@${user.id}>さんが🍬スタンプを押したよ！！っ`,
		);
	}
});

client.login(config.token);
