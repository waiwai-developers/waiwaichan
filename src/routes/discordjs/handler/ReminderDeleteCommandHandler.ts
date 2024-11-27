import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "./SlashCommandHandler";

@injectable()
export class ReminderDeleteCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.ReminderLogic)
	private reminderLogic!: IReminderLogic;

	isHandle(commandName: string): boolean {
		return commandName === "reminderdelete";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.reminderLogic.delete(
				new ReminderId(interaction.options?.getInteger("id", true)),
				new DiscordUserId(interaction.user.id),
			),
		);
	}
}
