import { REST, Routes, SlashCommandBuilder } from "discord.js";
import config from "../../config.json" with { type: "json" };
import command from "../../config/commands.json" with { type: "json" };
import { TranslateConst } from "../../entities/index.js";
const rest = new REST({ version: "10" }).setToken(config.token);

const commands = [
	new SlashCommandBuilder()
		.setName("help")
		.setDescription("help")
		.addStringOption((option) =>
			option
				.setName("category")
				.setDescription("string")
				.setRequired(true)
				.addChoices(
					{ name: "全てのコマンド", value: "all" },
					{ name: command[0].category.name, value: command[0].category.name },
					{ name: command[1].category.name, value: command[1].category.name },
					{ name: command[2].category.name, value: command[2].category.name },
				),
		),
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
				.addChoices(...TranslateConst.source),
		)
		.addStringOption((option) =>
			option
				.setName("target")
				.setDescription("string")
				.setRequired(true)
				.addChoices(...TranslateConst.target),
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
			option.setName("datetime").setDescription("string").setRequired(true),
		)
		.addStringOption((option) =>
			option.setName("message").setDescription("string").setRequired(true),
		),
	new SlashCommandBuilder()
		.setName("reminderdelete")
		.setDescription("reminder string")
		.addStringOption((option) =>
			option.setName("id").setDescription("string").setRequired(true),
		),
	new SlashCommandBuilder()
		.setName("reminderlist")
		.setDescription("reminder string"),
	new SlashCommandBuilder().setName("pointcheck").setDescription("pointcheck"),
	new SlashCommandBuilder().setName("pointdraw").setDescription("pointdraw"),
	new SlashCommandBuilder().setName("pointitem").setDescription("pointitem"),
	new SlashCommandBuilder()
		.setName("pointchange")
		.setDescription("pointchange")
		.addIntegerOption((option) =>
			option.setName("id").setDescription("integer").setRequired(true),
		)
].map((command) => command.toJSON());

(async () => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(config.clientId, config.guildId),
			{
				body: commands,
			},
		);
	} catch (e) {
		console.error(e);
	}
})();
