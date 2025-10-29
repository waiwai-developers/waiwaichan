import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IRoomAddChannelLogic } from "@/src/logics/Interfaces/logics/IRoomAddChannelLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoomAddChannelDeleteCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.RoomAddChannelLogic)
	private roomAddChannelLogic!: IRoomAddChannelLogic;
	isHandle(commandName: string): boolean {
		return commandName === "roomAddChannelDelete";
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
			interaction.reply("部屋追加チャンネルを登録する権限を持っていないよ！っ");
			return;
		}

		const roomAddChannel = await this.roomAddChannelLogic.find(
			new RoomAddChannelDto(
				new DiscordGuildId(interaction.guildId),
				new DiscordChannelId(interaction.options.getString("channelid", true))
			)
		);
		if (roomAddChannel === undefined) {
			await interaction.reply(
				"部屋追加チャンネルが登録されていなかったよ！っ",
			);
			return;
		}

		const channel = interaction.guild?.channels.cache.get(
			interaction.options.getString("channelid", true),
		);
		if (!(channel instanceof TextChannel)) {
			await interaction.reply(
				"このチャンネルは部屋追加チャンネルとして登録できないよ！っ",
			);
			return;
		}

		await interaction.reply(
			await this.roomAddChannelLogic.delete(
				new RoomAddChannelDto(
					new DiscordGuildId(interaction.guildId),
					new DiscordMessageId(interaction.options.getString("channelid", true)),
				),
			),
		);
	}
}