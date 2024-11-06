const { SlashCommandBuilder, REST, Routes } = require("discord.js");
const { token, clientId, guildId } = require("../../config.json");
const rest = new REST({ version: "10" }).setToken(token);

const commands = [
	new SlashCommandBuilder().setName("help").setDescription("help"),
	new SlashCommandBuilder().setName("waiwai").setDescription("waiwai"),
	new SlashCommandBuilder()
		.setName("parrot")
		.setDescription("parrot string")
		.addStringOption((option) =>
			option.setName("message").setDescription("string").setRequired(true),
		),
	new SlashCommandBuilder()
		.setName("dice")
		.setDescription("dice integer")
		.addStringOption((option) =>
			option.setName("parameter").setDescription("integer").setRequired(true),
		),
	new SlashCommandBuilder()
		.setName("choice")
		.setDescription("choice [string]")
		.addStringOption((option) =>
			option.setName("items").setDescription("string").setRequired(true),
		),
	new SlashCommandBuilder()
		.setName("translate")
		.setDescription("translate string")
		.addStringOption((option) =>
			option
				.setName("source")
				.setDescription("string")
				.setRequired(true)
				.addChoices(
					{ name: "Arabic", value: "AR" },
					// { name: 'Bulgarian', value: 'BG'},
					{ name: "Czech", value: "CS" },
					{ name: "Danish", value: "DA" },
					{ name: "German", value: "DE" },
					{ name: "Greek", value: "EL" },
					{ name: "English", value: "EN" },
					{ name: "Spanish", value: "ES" },
					{ name: "Estonian", value: "ET" },
					{ name: "Finnish", value: "ET" },
					{ name: "French", value: "FR" },
					// { name: 'Hungarian', value: 'HU'},
					{ name: "Indonesian", value: "ID" },
					{ name: "Italian", value: "IT" },
					{ name: "Japanese", value: "JA" },
					{ name: "Korean", value: "KO" },
					// { name: 'Lithuanian', value: 'LT'},
					{ name: "Latvian", value: "LV" },
					{ name: "Norwegian", value: "NB" },
					{ name: "Dutch", value: "NL" },
					{ name: "Polish", value: "PL" },
					// { name: 'Portuguese', value: 'PT'},
					// { name: 'Romanian', value: 'RO'},
					// { name: 'Russian', value: 'RU'},
					// { name: 'Slovak', value: 'SK'},
					// { name: 'Slovenian', value: 'SL'},
					{ name: "Swedish", value: "SV" },
					{ name: "Turkish", value: "TR" },
					{ name: "Ukrainian", value: "UK" },
					{ name: "Chinese", value: "ZH" },
				),
		)
		.addStringOption((option) =>
			option
				.setName("target")
				.setDescription("string")
				.setRequired(true)
				.addChoices(
					{ name: "Arabic", value: "AR" },
					// { name: 'Bulgarian', value: 'BG'},
					{ name: "Czech", value: "CS" },
					{ name: "Danish", value: "DA" },
					{ name: "German", value: "DE" },
					{ name: "Greek", value: "EL-GB" },
					{ name: "English (British)", value: "EN-GB" },
					{ name: "English (American)", value: "EN-US" },
					{ name: "Spanish", value: "ES" },
					{ name: "Estonian", value: "ET" },
					{ name: "Finnish", value: "ET" },
					{ name: "French", value: "FI" },
					{ name: "French", value: "FR" },
					// { name: 'Hungarian', value: 'HU'},
					{ name: "Indonesian", value: "ID" },
					{ name: "Italian", value: "IT" },
					{ name: "Japanese", value: "JA" },
					{ name: "Korean", value: "KO" },
					// { name: 'Lithuanian', value: 'LT'},
					{ name: "Latvian", value: "LV" },
					{ name: "Norwegian", value: "NB" },
					{ name: "Dutch", value: "NL" },
					{ name: "Polish", value: "PL" },
					// { name: 'Portuguese (Brazilian)', value: 'PT-BR'},
					// { name: 'Portuguese (all Portuguese variants excluding Brazilian Portuguese)', value: 'PT-PT'},
					// { name: 'Romanian', value: 'RO'},
					// { name: 'Russian', value: 'RU'},
					// { name: 'Slovak', value: 'SK'},
					// { name: 'Slovenian', value: 'SL'},
					{ name: "Swedish", value: "SV" },
					{ name: "Turkish", value: "TR" },
					{ name: "Ukrainian", value: "UK" },
					{ name: "Chinese (simplified)", value: "ZH" },
					{ name: "Chinese (traditional)", value: "ZH" },
				),
		)
		.addStringOption((option) =>
			option.setName("messages").setDescription("string").setRequired(true),
		),
	new SlashCommandBuilder()
		.setName("talk")
		.setDescription("talk string")
		.addStringOption((option) =>
			option.setName("title").setDescription("string").setRequired(true),
		),
	new SlashCommandBuilder()
			.setName("reminderset")
			.setDescription("reminder string")
		.addStringOption((option) =>
			option.setName("datetime").setDescription("string").setRequired(true))
	    .addStringOption((option) =>
	      option.setName("message").setDescription("string").setRequired(true)),
	new SlashCommandBuilder()
			.setName("reminderdelete")
			.setDescription("reminder string")
	    .addStringOption((option) =>
	      option.setName("id").setDescription("string").setRequired(true),
	  ),
	new SlashCommandBuilder()
			.setName("reminderlist")
			.setDescription("reminder string")
	].map((command) => command.toJSON());

(async () => {
	try {
		await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
			body: commands,
		});
	} catch (e) {
		console.error(e);
	}
})();
