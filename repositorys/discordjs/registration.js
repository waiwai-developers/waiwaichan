const { SlashCommandBuilder, REST, Routes } = require('discord.js');
const { token, clientId, guildId } = require('../../config.json');
const rest = new REST({ version: '10' }).setToken(token);

const commands = [
  new SlashCommandBuilder()
      .setName('waiwai')
      .setDescription('waiwai'),
  new SlashCommandBuilder()
    .setName('parrot')
    .setDescription('parrot string')
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
    ),
  new SlashCommandBuilder()
    .setName('translate')
    .setDescription('translate string')
    .addStringOption(option =>
      option.setName('source')
        .setDescription('string')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('target')
        .setDescription('string')
        .setRequired(true)
    )
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
