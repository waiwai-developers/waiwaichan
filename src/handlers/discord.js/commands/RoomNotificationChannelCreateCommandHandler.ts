import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IRoomNotificationChannelLogic } from "@/src/logics/Interfaces/logics/IRoomNotificationChannelLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoomNotificationChannelCreateCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.RoomNotificationChannelLogic)
	private roomNotificationChannelLogic!: IRoomNotificationChannelLogic;
	isHandle(commandName: string): boolean {
		return commandName === "roomNotificationChannelCreate";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}
		if (interaction.channel == null) {
			return;
		}
		// NOTE: todo CommunityとUserの追加を行ったあとにrbacを実現する
		if (
			RoleConfig.users.find((u) => u.discordId === interaction.user.id)
				?.role !== "admin"
		) {
			interaction.reply("部屋通知チャンネルを登録する権限を持っていないよ！っ");
			return;
		}

		const roomNotificationChannel = await this.roomNotificationChannelLogic.find(
			new RoomNotificationChannelDto(
				new DiscordGuildId(interaction.guildId),
				new DiscordChannelId(interaction.options.getString("channelid", true))
			)
		);
		if (roomNotificationChannel !== undefined) {
			await interaction.reply(
				"部屋通知チャンネルが既に登録されているよ！っ",
			);
			return;
		}

		const channel = interaction.guild?.channels.cache.get(
			interaction.options.getString("channelid", true),
		);
		if (!(channel instanceof TextChannel)) {
			await interaction.reply(
				"このチャンネルは部屋通知チャンネルとして登録できないよ！っ",
			);
			return;
		}

		await interaction.reply(
			await this.roomNotificationChannelLogic.create(
				new RoomNotificationChannelDto(
					new DiscordGuildId(interaction.guildId),
					new DiscordMessageId(interaction.options.getString("channelid", true)),
				),
			),
		);
	}
}
