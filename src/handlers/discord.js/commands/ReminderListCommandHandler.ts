import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ReminderListCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.ReminderLogic)
	private reminderLogic!: IReminderLogic;

	isHandle(commandName: string): boolean {
		return commandName === "reminderlist";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}
		await interaction.reply(
			await this.reminderLogic.list(
				new DiscordGuildId(interaction.guildId),
				new DiscordUserId(interaction.user.id),
			),
		);
	}
}
