import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CandyCount } from "@/src/entities/vo/CandyCount";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CandyDrawCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.CandyLogic)
	private candyLogic!: ICandyLogic;

	isHandle(commandName: string): boolean {
		return commandName === "candydraw";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}
		await interaction.reply(
			await this.candyLogic.drawItems(
				new DiscordGuildId(interaction.guildId),
				new DiscordUserId(interaction.user.id),
				new CandyCount(1),
			),
		);
	}
}
