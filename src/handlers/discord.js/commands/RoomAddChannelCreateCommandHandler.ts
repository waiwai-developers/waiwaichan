import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IRoomAddChannelLogic } from "@/src/logics/Interfaces/logics/IRoomAddChannelLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { VoiceChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoomAddChannelCreateCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.RoomAddChannelLogic)
	private roomAddChannelLogic!: IRoomAddChannelLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	isHandle(commandName: string): boolean {
		return commandName === "roomaddchannelcreate";
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
			await interaction.reply(
				"部屋追加チャンネルを登録する権限を持っていないよ！っ",
			);
			return;
		}

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId))
			)
		);
		if (communityId == null) {
			return;
		}

		const roomAddChannel = await this.roomAddChannelLogic.find(communityId);
		if (roomAddChannel !== undefined) {
			await interaction.reply("部屋追加チャンネルが既に登録されているよ！っ");
			return;
		}

		const channel = interaction.guild?.channels.cache.get(
			interaction.options.getString("channelid", true),
		);
		if (!(channel instanceof VoiceChannel)) {
			await interaction.reply(
				"このチャンネルはボイスチャンネルないので部屋追加チャンネルとして登録できないよ！っ",
			);
			return;
		}

		await interaction.reply(
			await this.roomAddChannelLogic.create(
				new RoomAddChannelDto(
					communityId,
					new DiscordMessageId(
						interaction.options.getString("channelid", true),
					),
				),
			),
		);
	}
}
