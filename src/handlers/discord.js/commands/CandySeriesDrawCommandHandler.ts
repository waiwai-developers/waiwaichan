import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CandySeriesDrawCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.CandyLogic)
	private candyLogic!: ICandyLogic;

	isHandle(commandName: string): boolean {
		return commandName === "candyseriesdraw";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.candyLogic.drawSeriesItem(
				new DiscordUserId(interaction.user.id),
			),
		);
	}
}
