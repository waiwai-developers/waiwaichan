const { Client,GatewayIntentBits } = require("discord.js");
const env = require('dotenv').config();
const client = new Client({
  intents: Object.values(GatewayIntentBits).reduce((a, b) => a | b)
});

client.on("ready", () => {
  console.log(`login: ${client.user.tag}`);
});

client.on("messageCreate", async msg => {
  const [botname, command, parameter] = msg.content.split(' ');
  if (botname === "/waiwai") {
    switch (command) {
      case 'parrot':
        msg.reply(parameter);
        break;
      default:
        msg.reply('そんなコマンドはないよ！っ');
    }
  }
});

client.login(env.DISCORD_TOKEN);
