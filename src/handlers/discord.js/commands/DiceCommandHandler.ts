import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiceSides } from "@/src/entities/vo/DiceSides";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class DiceCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "dice";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.utilLogic.dice(
				new DiceSides(interaction.options?.getInteger("parameter", true)),
			),
		);
	}
}
