import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { HelpCategory } from "@/src/entities/vo/HelpCategory";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "./SlashCommandHandler";

@injectable()
export class HelpCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "help";
	}
	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.utilLogic.help(
				new HelpCategory(interaction.options?.getString("category", true)),
			),
		);
	}
}
