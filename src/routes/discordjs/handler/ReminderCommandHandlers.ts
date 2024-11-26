import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import dayjs from "dayjs";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "./SlashCommandHandler";

@injectable()
export class ReminderSetCommandHandlers implements SlashCommandHandler {
	@inject(LogicTypes.ReminderLogic)
	private reminderLogic!: IReminderLogic;

	isHandle(commandName: string): boolean {
		return commandName === "reminderset";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.reminderLogic.create(
				new ReminderDto(
					new ReminderId(0),
					new DiscordChannelId(interaction.channelId),
					new DiscordUserId(interaction.user.id),
					new ReminderMessage(interaction.options.getString("message", true)),
					new RemindTime(
						dayjs(interaction.options.getString("datetime"))
							.subtract(9, "h")
							.toDate(),
					),
				),
			),
		);
	}
}

@injectable()
export class ReminderDeleteCommandHandlers implements SlashCommandHandler {
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

@injectable()
export class ReminderListCommandHandlers implements SlashCommandHandler {
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
