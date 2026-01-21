import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type {
	VoiceChannelEventHandler,
	VoiceChannelState,
} from "@/src/handlers/discord.js/events/VoiceChannelEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IRoomAddChannelLogic } from "@/src/logics/Interfaces/logics/IRoomAddChannelLogic";
import type { IRoomChannelLogic } from "@/src/logics/Interfaces/logics/IRoomChannelLogic";
import type { IRoomNotificationChannelLogic } from "@/src/logics/Interfaces/logics/IRoomNotificationChannelLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { ChannelType, EmbedBuilder } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class VoiceChannelConnectHandler
	implements VoiceChannelEventHandler<VoiceChannelState>
{
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@inject(LogicTypes.RoomAddChannelLogic)
	private roomAddChannelLogic!: IRoomAddChannelLogic;
	@inject(LogicTypes.RoomNotificationChannelLogic)
	private roomNotificationChannelLogic!: IRoomNotificationChannelLogic;
	@inject(LogicTypes.RoomChannelLogic)
	private roomChannelLogic!: IRoomChannelLogic;
	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	async handle({ newState }: VoiceChannelState): Promise<void> {
		// 新規接続でない
		if (newState.channelId === null) {
			this.logger.info("not voice channel connect");
			return;
		}
		if (newState.member === null) {
			this.logger.info("not exist user in channel");
			return;
		}
		if (newState.channel === null) {
			this.logger.info("no exist new state channel");
			return;
		}

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(newState.guild.id)),
			),
		);
		if (communityId == null) {
			this.logger.info("not exist community");
			return;
		}

		//communityIdで部屋追加Channelを取得し存在チェック
		const roomAddChannel = await this.roomAddChannelLogic.find(communityId);
		if (roomAddChannel === undefined) {
			this.logger.info("not exist room add channel");
			return;
		}
		//todo: おそらくすべてのguildIdやchannelIdでstringのように見えているが実はBigintで扱われている可能性があるので修正する
		if (
			String(roomAddChannel.channelId.getValue()) !== String(newState.channelId)
		) {
			this.logger.info("not match room add channel");
			return;
		}

		//新しく部屋と部屋データを作成しユーザーを移動
		const newChannel = await newState.guild.channels.create({
			name: `${newState.member.user.displayName}の部屋`,
			type: ChannelType.GuildVoice,
		});
		await this.roomChannelLogic.create(
			new RoomChannelDto(communityId, new DiscordChannelId(newChannel.id)),
		);
		await newState.member.voice.setChannel(newChannel);

		//communityIdから部屋通知Channelを取得し通知を送信
		const roomNotificationChannel =
			await this.roomNotificationChannelLogic.find(communityId);
		if (roomNotificationChannel === undefined) {
			this.logger.info("not setting room notification channel");
			return;
		}
		const notificationChannel = newState.guild.channels.cache.get(
			roomNotificationChannel.channelId.getValue(),
		);
		if (notificationChannel === undefined) {
			this.logger.info("not exist notification channel");
			return;
		}
		if (!notificationChannel.isTextBased()) {
			this.logger.info("notification channel is not text channel");
			return;
		}
		const avatarUrl = newState.member.user.displayAvatarURL({
			size: 1024,
		});
		const embed = new EmbedBuilder()
			.setTitle("通話を開始したよ！っ")
			.setDescription(`${newState.channel.name}`)
			.setThumbnail(avatarUrl)
			.addFields(
				{
					name: "開始ユーザー",
					value: `<@${newState.member.user.id}>`,
					inline: true,
				},
				{
					name: "開始時刻",
					value: new Date().toLocaleString("ja-JP", {
						timeZone: "Asia/Tokyo",
					}),
					inline: true,
				},
			)
			.setColor(0x00b894);
		await notificationChannel.send({ embeds: [embed] });
	}
}
