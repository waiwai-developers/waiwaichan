import { Client, GatewayIntentBits } from "discord.js";
import config from "../../config.json" with { type: "json" };
import { generate } from "../../repositorys/chatgptapi/ChatGPT.js";

const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b),
});
client.on("ready", () => {
	console.log(`login: ${client.user.tag}`);
});
client.on("messageCreate", async (message) => {
	try {
		if (message == null) {
			await interaction.reply("messageパラメーターがないよ！っ");
			return;
		}
		if (message.author.bot) return;
		if (!message.channel.isThread()) return;
		if (!(message.channel.ownerId === config.discord.clientId)) return;

		const fetchedMessages = await message.channel.messages.fetch({ limit: 11 });
		const replyMessage = await message.reply("ちょっと待ってね！っ");
		const sendMessages = [{ role: "system", content: config.openai.gptPrompt }];
		fetchedMessages.reverse().forEach((m) =>
			sendMessages.push({
				role: m.author.bot ? "system" : "user",
				content: m.content,
			}),
		);
		const generated = await generate(sendMessages);
		await replyMessage.edit(generated.choices[0].message.content);
	} catch (e) {
		console.error("Error:", e);
	}
});
client.login(config.discord.token);
