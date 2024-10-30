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
      try{
        switch (command) {
          case 'parrot':
            if (parameter == null) {
              msg.reply('パラメーターがないよ！っ');
              return
            }

            msg.reply(parameter);
            break;
          case 'dice':
            if (parameter == null) {
              msg.reply('パラメーターがないよ！っ');
              return
            }
            if (!Number.isInteger(Number(parameter))) {
              msg.reply('パラメーターが整数じゃないよ！っ');
              return
            }

            const random = Math.floor(Math.random() * (Number(parameter)) + 1)
            msg.reply(random.toString(10));
            break;
          default:
            msg.reply('そんなコマンドはないよ！っ');
        }
      } catch (e) {
        console.log(e)
        msg.reply('エラーが起こったよ！っ');
      }
    }
});

client.login(env.DISCORD_TOKEN);
