import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type {
	VoiceChannelEventHandler,
	VoiceChannelState,
} from "@/src/handlers/discord.js/events/VoiceChannelEventHandler";
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

		//過去に部屋追加チャンネルによって立てた部屋かチェック
		const roomChannel = await this.roomChannelLogic.find(
			new RoomChannelDto(
				new DiscordGuildId(oldState.guild.id),
				new DiscordChannelId(oldState.channelId),
			),
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
			new RoomChannelDto(
				new DiscordGuildId(oldState.guild.id),
				new DiscordChannelId(oldState.channelId),
			),
		);
		await oldState.guild.channels.delete(oldState.channelId);

		//guildIDから部屋通知Channelを取得し通知を送信
		const roomNotificationChannel =
			await this.roomNotificationChannelLogic.find(
				new DiscordGuildId(oldState.guild.id),
			);
		if (roomNotificationChannel === undefined) {
			this.logger.info("not setting room notification channel");
			return;
		}
		const notificationChannel = oldState.guild.channels.cache.get(
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
		const embed = new EmbedBuilder()
			.setTitle("通話を終了したよ！っ")
			.setDescription(`${channelName}`)
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
