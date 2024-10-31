const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('../config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(token);

const commands = [
  new SlashCommandBuilder()
      .setName('waiwai')
      .setDescription('reply waiwai'),
    new SlashCommandBuilder()
      .setName('parrot')
      .setDescription('reply parrot')
      .addStringOption(option =>
        option.setName('message')
            .setDescription('string')
            .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('dice')
      .setDescription('dice integer')
      .addStringOption(option =>
        option.setName('message')
            .setDescription('string')
            .setRequired(true)
      ),
    new SlashCommandBuilder()
      .setName('choice')
      .setDescription('choice [string]')
      .addStringOption(option =>
        option.setName('message')
            .setDescription('string')
            .setRequired(true)
      )
].map(command => command.toJSON());

(async () => {
  try {
      await rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { body: commands },
      );
  } catch (e) {
      console.error(e)
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  console.log(interaction);

  const command = interaction.commandName;
  const parameters = interaction.options?.getString('message')?.split(' ') ?? null
  let parameter = null
  try{
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
      default:
        interaction.reply('そんなコマンドはないよ！っ')
    }
  } catch (e) {
    console.log(e)
    interaction.reply('エラーが起こったよ！っ')
  }
});

client.login(token);
