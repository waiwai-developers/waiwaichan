import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import type { SlashCommandHandler } from "./SlashCommandHandler";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { IDiceLogic } from "@/src/logics/Interfaces/logics/IDiceLogic";
import { DiceSource } from "@/src/entities/vo/DiceSource";
import { DiceIsSecret } from "@/src/entities/vo/DiceIsSecret";
import { DiceShowDetails } from "@/src/entities/vo/DiceShowDetails";
import { DiceContextDto } from "@/src/entities/dto/DiceContextDto";

@injectable()
export class Dice2CommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.DiceLogic)
	private diceLogic!: IDiceLogic;

	isHandle(commandName: string): boolean {
		return commandName === "dice2";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply({
			embeds: [
				await this.diceLogic.dice2(
					new DiceContextDto(
						new DiceSource(interaction.options?.getString("source", true)),
						new DiceIsSecret(
							!!interaction.options?.getBoolean("secret", false),
						),
						new DiceShowDetails(
							!!interaction.options?.getBoolean("details", false),
						),
						interaction.user,
					),
				),
			],
		});
	}
}
