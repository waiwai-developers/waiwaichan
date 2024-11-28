import { AppConfig } from "@/src/entities/config/AppConfig";
import { CommandsConfig } from "@/src/entities/config/CommandsConfig";
import { TranslateConst } from "@/src/entities/constants/translate";
import {
	REST,
	Routes,
	SlashCommandBuilder,
	type SlashCommandOptionsOnlyBuilder,
} from "discord.js";

export class DiscordCommandRegister {
	commands: SlashCommandOptionsOnlyBuilder[] = [];
	constructor() {
		this.commands = [
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
							...CommandsConfig.categories.map((c) => {
								return { name: c.name, value: c.name };
							}),
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
				.addIntegerOption((option) =>
					option
						.setName("parameter")
						.setDescription("integer")
						.setRequired(true),
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
				)
				.addStringOption((option) =>
					option.setName("user").setDescription("string").setRequired(true),
				),
			new SlashCommandBuilder()
				.setName("reminderdelete")
				.setDescription("reminder string")
				.addIntegerOption((option) =>
					option.setName("id").setDescription("string").setRequired(true),
				),
			new SlashCommandBuilder()
				.setName("reminderlist")
				.setDescription("reminder string"),
			new SlashCommandBuilder()
				.setName("pointcheck")
				.setDescription("pointcheck"),
			new SlashCommandBuilder()
				.setName("pointdraw")
				.setDescription("pointdraw"),
			new SlashCommandBuilder()
				.setName("pointitem")
				.setDescription("pointitem"),
			new SlashCommandBuilder()
				.setName("pointchange")
				.setDescription("pointchange")
				.addIntegerOption((option) =>
					option.setName("id").setDescription("integer").setRequired(true),
				),
			new SlashCommandBuilder()
				.setName("reviewgacha")
				.setDescription("reviewgacha integer")
				.addIntegerOption((option) =>
					option.setName("id").setDescription("string").setRequired(true),
				),
			new SlashCommandBuilder()
				.setName("reviewlist")
				.setDescription("reviewlist"),
			new SlashCommandBuilder()
				.setName("minecraftstart")
				.setDescription("minecraftstart"),
			new SlashCommandBuilder()
				.setName("minecraftstop")
				.setDescription("minecraftstop"),
		];
	}
	async register(token: string) {
		const rest = new REST({ version: "10" }).setToken(token);
		await rest.put(
			Routes.applicationGuildCommands(
				AppConfig.discord.clientId,
				AppConfig.discord.guildId,
			),
			{
				body: this.commands.map((command) => command.toJSON()),
			},
		);
	}
}
