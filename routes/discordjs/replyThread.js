import { Client, GatewayIntentBits } from "discord.js";
import { clientId, gptPrompt, token } from "../../config.json";
import chatgpt from "../../repositorys/chatgptapi/ChatGPT.js";

const client = new Client({
	intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b),
});
client.on("ready", () => {
	console.log(`login: ${client.user.tag}`);
});
client.on("messageCreate", async (message) => {
	try {
		if (message.author.bot) return;
		if (!message.channel.isThread()) return;
		if (!(message.channel.ownerId === clientId)) return;

		if (message == null) {
			await interaction.reply("messageパラメーターがないよ！っ");
			return;
		}

		const fetchedMessages = await message.channel.messages.fetch({ limit: 11 });
		const replyMessage = await message.reply("ちょっと待ってね！っ");
		const sendMessages = [{ role: "system", content: gptPrompt }];

		for (const message of fetchedMessages.reverse()) {
			sendMessages.push({
				role: m.author.bot ? "system" : "user",
				content: m.content,
			});
		}
		const generate = await chatgpt.generate(sendMessages);
		await replyMessage.edit(generate.choices[0].message.content);
	} catch (e) {
		console.error("Error:", e);
	}
});
client.login(token);
