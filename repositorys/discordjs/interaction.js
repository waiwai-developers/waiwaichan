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
        await interaction.reply('waiwai')
        break;
      case 'parrot':
        parameter = parameters[0]

        if (parameter == null) {
          await interaction.reply('パラメーターがないよ！っ');
          return
        }

        await interaction.reply(parameter);
        break;
      case 'dice':
        parameter = parameters[0]

        if (parameter == null) {
          await interaction.reply('パラメーターがないよ！っ')
          return
        }
        if (!Number.isInteger(Number(parameter))) {
          await interaction.reply('パラメーターが整数じゃないよ！っ')
          return
        }
        if (!Number.isInteger(Number(parameter) <= 0)) {
          await interaction.reply('パラメーターが0以下の数だよ！っ')
          return
        }

        await interaction.reply(Math.floor(Math.random() * (Number(parameter)) + 1).toString(10));
        break;
      case 'choice':
        if (parameters == []) {
          await interaction.reply('パラメーターがないよ！っ')
          return
        }

        await interaction.reply(parameters[Math.floor(Math.random() * (Number(parameters.length))).toString(10)]);
        break;
      case 'translate':
        const source = interaction.options?.getString('source')
        const target = interaction.options?.getString('target')

        if (message == null) {
          await interaction.reply('messageパラメーターがないよ！っ')
          return
        }
        if (source == null) {
          await interaction.reply('sourceパラメーターがないよ！っ')
          return
        }
        if (target == null) {
          await interaction.reply('targetパラメーターがないよ！っ')
          return
        }
        if (source == target) {
          await interaction.reply('sourceとtargetが同じだよ！っ')
          return
        }

        const texts = message.split('  ')
        const postMessages = []

        await interaction.deferReply()
        let translate = null
        for (const text of texts) {
          translate = await deeplapi.translate(text, source, target)
          postMessages.push(translate.text + '\n' + text)
        }

        if (postMessages == []) {
          await interaction.reply('翻訳できなかったよ！っ')
          return
        }

        await interaction.editReply(postMessages.join('\n\n'));
        break;
      case 'talk':
        const title = interaction.options?.getString('title')
        if (title == null) {
          await interaction.reply('titleパラメーターがないよ！っ');
          return
        }

        await interaction.reply('以下にお話する場を用意したよ！っ')
        await interaction.channel.threads.create({
          name: title,
          autoArchiveDuration: 60
        });
        break;
      default:
        await interaction.reply('そんなコマンドはないよ！っ')
    }
  } catch (e) {
    console.error("Error:", e)
    await interaction.reply('エラーが起こったよ！っ')
  }
});

client.login(token);
