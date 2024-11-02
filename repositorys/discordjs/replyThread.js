const { Client,GatewayIntentBits } = require("discord.js");
const { token, clientId } = require('../../config.json');
const chatgpt = require('../chatgptapi/generate');
const client = new Client({
  intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b)
});

client.on("ready", () => {
  console.log(`login: ${client.user.tag}`);
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.channel.isThread()) return;
  if (!(message.channel.ownerId === clientId)) return;

  if (message == null) {
    interaction.reply('messageパラメーターがないよ！っ');
    return
  }

  const replyMessage = await message.reply("ちょっと待ってね！っ");

  const generate = await chatgpt.generate(message.content)

  await replyMessage.edit(generate.choices[0].message.content);
});

client.login(token);
