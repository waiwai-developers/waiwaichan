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

	async handle({ oldState, newState }: VoiceChannelState): Promise<void> {
		// 接続解除でない
		if (oldState.channelId === null || newState.channelId !== null) {
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

		// botではないユーザーがまだチャンネルに残っている場合は削除しない
		const users = oldState.channel.members.filter((member) => !member.user.bot);
		if (users.size > 0) {
			this.logger.info("no bot users still in channel, not deleting");
			return;
		}

		// チャンネル名を保存
		const channelName = oldState.channel.name;

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
			)
			.setColor(0xb80094);
		await notificationChannel.send({ embeds: [embed] });
	}
}
