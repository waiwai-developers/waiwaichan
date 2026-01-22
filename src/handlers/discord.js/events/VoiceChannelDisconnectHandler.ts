import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type {
	VoiceChannelEventHandler,
	VoiceChannelState,
} from "@/src/handlers/discord.js/events/VoiceChannelEventHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IRoomChannelLogic } from "@/src/logics/Interfaces/logics/IRoomChannelLogic";
import type { IRoomNotificationChannelLogic } from "@/src/logics/Interfaces/logics/IRoomNotificationChannelLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { EmbedBuilder } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class VoiceChannelDisconnectHandler
	implements VoiceChannelEventHandler<VoiceChannelState>
{
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@inject(LogicTypes.RoomNotificationChannelLogic)
	private roomNotificationChannelLogic!: IRoomNotificationChannelLogic;
	@inject(LogicTypes.RoomChannelLogic)
	private roomChannelLogic!: IRoomChannelLogic;
	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;
	@inject(LogicTypes.ChannelLogic)
	private ChannelLogic!: IChannelLogic;

	async handle({ oldState }: VoiceChannelState): Promise<void> {
		// 接続解除でない
		if (oldState.channelId === null) {
			this.logger.info("not voice channel disconnect");
			return;
		}
		if (oldState.member === null) {
			this.logger.info("no exist old state user");
			return;
		}
		if (oldState.channel === null) {
			this.logger.info("no exist old state channel");
			return;
		}

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(oldState.guild.id)),
			),
		);
		if (communityId == null) {
			this.logger.info("not exist community");
			return;
		}

		// 接続解除したチャンネルのIDを取得
		const disconnectedChannelId = await this.ChannelLogic.getId(
			new ChannelDto(
				ChannelCategoryType.Discord,
				new ChannelClientId(BigInt(oldState.channelId)),
				ChannelType.DiscordVoice,
				new ChannelCommunityId(communityId.getValue()),
			),
		);
		if (disconnectedChannelId == null) {
			this.logger.info("not exist disconnected channel");
			return;
		}

		//過去に部屋追加チャンネルによって立てた部屋かチェック
		const roomChannel = await this.roomChannelLogic.find(
			new RoomChannelDto(communityId, disconnectedChannelId),
		);
		if (roomChannel === undefined) {
			this.logger.info("no add channel create room");
			return;
		}

		// botではないユーザーがまだチャンネルに残っている場合は削除しない
		const users = oldState.channel.members.filter((member) => !member.user.bot);
		if (users.size > 0) {
			this.logger.info("no bot users still in channel, not deleting");
			return;
		}

		// チャンネル名を保存
		const channelName = oldState.channel.name;

		// チャンネルの経過時間を保存
		const createdTimestamp = oldState.channel.createdTimestamp;
		const currentTimestamp = Date.now();
		const elapsedMs = currentTimestamp - createdTimestamp;

		const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
		const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
		const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

		const hoursStr = hours === 0 ? "00" : `${hours}`;
		const minutesStr = minutes === 0 ? "00" : `${minutes}`;
		const secondsStr = seconds === 0 ? "00" : `${seconds}`;

		const channelElapsedTimeStr = `${hoursStr}時間${minutesStr}分${secondsStr}秒`;

		//立てた部屋データと部屋を削除
		await this.roomChannelLogic.delete(
			new RoomChannelDto(communityId, disconnectedChannelId),
		);
		await oldState.guild.channels.delete(oldState.channelId);

		//communityIdから部屋通知Channelを取得し通知を送信
		const roomNotificationChannel =
			await this.roomNotificationChannelLogic.find(communityId);
		if (roomNotificationChannel === undefined) {
			this.logger.info("not setting room notification channel");
			return;
		}
		const notificationChannel = oldState.guild.channels.cache.get(
			String(roomNotificationChannel.channelId.getValue()),
		);
		if (notificationChannel === undefined) {
			this.logger.info("not exist notification channel");
			return;
		}
		if (!notificationChannel.isTextBased()) {
			this.logger.info("notification channel is not text channel");
			return;
		}
		const avatarUrl = oldState.member.user.displayAvatarURL({
			size: 1024,
		});
		const embed = new EmbedBuilder()
			.setTitle("通話を終了したよ！っ")
			.setDescription(`${channelName}`)
			.setThumbnail(avatarUrl)
			.addFields(
				{
					name: "終了ユーザー",
					value: `<@${oldState.member.user.id}>`,
					inline: true,
				},
				{
					name: "終了時刻",
					value: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
					inline: true,
				},
				{
					name: "経過時間",
					value: channelElapsedTimeStr,
					inline: true,
				},
			)
			.setColor(0xb80094);
		await notificationChannel.send({ embeds: [embed] });
	}
}
