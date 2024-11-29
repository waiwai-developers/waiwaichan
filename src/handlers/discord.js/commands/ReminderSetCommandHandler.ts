import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import dayjs from "dayjs";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ReminderSetCommandHandler implements SlashCommandHandler {
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
					new ReceiveDiscordUserName(
						interaction.options.getString("username", true),
					),
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
