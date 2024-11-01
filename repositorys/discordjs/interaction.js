const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('../../config.json');
const deeplapi = require('../deeplapi/translate');
const chatgpt = require('../chatgptapi/generate');
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
        if (!Number.isInteger(Number(parameter) <= 0)) {
          interaction.reply('パラメーターが0以下の数だよ！っ')
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
        if (source == target) {
          interaction.reply('sourceとtargetが同じだよ！っ')
          return
        }

        const texts = message.split('  ')
        const postMessages = []

        let translate = null
        for (const text of texts) {
          translate = await deeplapi.translate(text, source, target)
          postMessages.push(translate.text + '\n' + text)
        }

        if (postMessages == []) {
          interaction.reply('翻訳できなかったよ！っ')
          return
        }

        interaction.reply(postMessages.join('\n\n'));
        break;
      case 'talk':
        if (message == null) {
          interaction.reply(message);
          return
        }

        const generate = await chatgpt.generate(message)
        interaction.reply(generate.choices[0].message);
        break;
      default:
        interaction.reply('そんなコマンドはないよ！っ')
    }
  } catch (e) {
    console.error("Error:", e)
    interaction.reply('エラーが起こったよ！っ')
  }
});

client.login(token);
