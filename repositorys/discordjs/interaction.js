const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('../../config.json');
const deeplapi = require('../deeplapi/translate');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('interactionCreate', async interaction => {
  try{
    if (!interaction.isCommand()) return;

    const command = interaction.commandName;
    const message = interaction.options?.getString('message') ?? null
    const parameters = message?.split(' ') ?? null
    let parameter = null
    switch (command) {
      case 'waiwai':
        interaction.reply('waiwai')
        break;
      case 'parrot':
        parameter = parameters[0]

        if (parameter == null) {
          interaction.reply('パラメーターがないよ！っ');
          return
        }

        interaction.reply(parameter);
        break;
      case 'dice':
        parameter = parameters[0]

        if (parameter == null) {
          interaction.reply('パラメーターがないよ！っ')
          return
        }
        if (!Number.isInteger(Number(parameter))) {
          interaction.reply('パラメーターが整数じゃないよ！っ')
          return
        }

        interaction.reply(Math.floor(Math.random() * (Number(parameter)) + 1).toString(10));
        break;
      case 'choice':
        if (parameters == []) {
          interaction.reply('パラメーターがないよ！っ')
          return
        }

        interaction.reply(parameters[Math.floor(Math.random() * (Number(parameters.length))).toString(10)]);
        break;
      case 'translate':
        const source = interaction.options?.getString('source')
        const target = interaction.options?.getString('target')


        if (message == null) {
          interaction.reply('messageパラメーターがないよ！っ')
          return
        }
        if (source == null) {
          interaction.reply('sourceパラメーターがないよ！っ')
          return
        }
        if (target == null) {
          interaction.reply('targetパラメーターがないよ！っ')
          return
        }

        const translate = await deeplapi.translate(message, source, target)

        if (translate == undefined || translate == null) {
          interaction.reply('翻訳できなかったよ！っ')
          return
        }

        interaction.reply(translate.text);
        break;
      default:
        interaction.reply('そんなコマンドはないよ！っ')
    }
  } catch (e) {
    console.log(e)
    interaction.reply('エラーが起こったよ！っ')
  }
});

client.login(token);
