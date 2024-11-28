import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ParrotMessage } from "@/src/entities/vo/ParrotMessage";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ParrotCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "parrot";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.utilLogic.parrot(
				new ParrotMessage(interaction.options?.getString("message", true)),
			),
		);
	}
}
