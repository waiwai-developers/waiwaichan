import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
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

	@inject(LogicTypes.ChannelLogic)
	private ChannelLogic!: IChannelLogic;

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

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (communityId == null) {
			await interaction.reply("コミュニティが登録されていなかったよ！っ");
			return;
		}

		const roomAddChannel = await this.roomAddChannelLogic.find(communityId);
		if (roomAddChannel !== undefined) {
			await interaction.reply("部屋追加チャンネルが既に登録されているよ！っ");
			return;
		}

		const targetChannelId = interaction.options.getString("channelid", true);
		const channel = interaction.guild?.channels.cache.get(targetChannelId);
		if (!(channel instanceof VoiceChannel)) {
			await interaction.reply(
				"このチャンネルはボイスチャンネルないので部屋追加チャンネルとして登録できないよ！っ",
			);
			return;
		}

		const channelId = await this.ChannelLogic.getId(
			new ChannelDto(
				ChannelCategoryType.Discord,
				new ChannelClientId(BigInt(targetChannelId)),
				ChannelType.DiscordVoice,
				new ChannelCommunityId(communityId.getValue()),
			),
		);
		if (channelId == null) {
			await interaction.reply("チャンネルが登録されていなかったよ！っ");
			return;
		}

		await interaction.reply(
			await this.roomAddChannelLogic.create(
				new RoomAddChannelDto(communityId, channelId),
			),
		);
	}
}
