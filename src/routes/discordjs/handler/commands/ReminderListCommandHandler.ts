import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "src/routes/discordjs/handler/commands/SlashCommandHandler";

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
		await interaction.reply(
			await this.reminderLogic.list(new DiscordUserId(interaction.user.id)),
		);
	}
}