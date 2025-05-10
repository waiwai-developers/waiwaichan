import { ITEM_RECORDS } from "@/migrator/seeds/20241111041901-item";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { CommandsConfig } from "@/src/entities/config/CommandsConfig";
import { CategoriesConst } from "@/src/entities/constants/personalityCategory";
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
					option.setName("title").setDescription("string").setRequired(true),
				)
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
				),
			new SlashCommandBuilder()
				.setName("talk")
				.setDescription("talk integer string")
				.addIntegerOption((option) =>
					option
						.setName("type")
						.setDescription("integer")
						.setRequired(true)
						.addChoices(
							// TODO read from in memory db
							CategoriesConst.categories.map((r) => {
								return { name: r.name, value: r.id };
							}),
						),
				)
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
					option.setName("username").setDescription("string").setRequired(true),
				)
				.addStringOption((option) =>
					option.setName("message").setDescription("string").setRequired(true),
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
				.setName("candycheck")
				.setDescription("candycheck"),
			new SlashCommandBuilder()
				.setName("candydraw")
				.setDescription("candydraw"),
			new SlashCommandBuilder()
				.setName("candyboxdraw")
				.setDescription("candyboxdraw"),
			new SlashCommandBuilder()
				.setName("candyitem")
				.setDescription("candyitem"),
			new SlashCommandBuilder()
				.setName("candyexchange")
				.setDescription("candyexchange")
				.addIntegerOption((option) =>
					option
						.setName("type")
						.setDescription("integer")
						.setRequired(true)
						.addChoices(
							// TODO read from in memory db
							ITEM_RECORDS.map((r) => {
								return { name: r.name, value: r.id };
							}),
						),
				)
				.addIntegerOption((option) =>
					option.setName("amount").setDescription("integer"),
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
			new SlashCommandBuilder()
				.setName("stickycreate")
				.setDescription("sticky create")
				.addStringOption((option) =>
					option
						.setName("channelid")
						.setDescription("string")
						.setRequired(true),
				),
			new SlashCommandBuilder()
				.setName("stickydelete")
				.setDescription("sticky delete")
				.addStringOption((option) =>
					option
						.setName("channelid")
						.setDescription("string")
						.setRequired(true),
				),
		];
	}
	async register(token: string) {
		const rest = new REST({ version: "10" }).setToken(token);
		await rest.put(Routes.applicationCommands(AppConfig.discord.clientId), {
			body: this.commands.map((command) => command.toJSON()),
		});
	}
}
