import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import type { RemindTime } from "@/src/entities/vo/RemindTime";
import type { ReminderId } from "@/src/entities/vo/ReminderId";
import type { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { IReminderRepository } from "@/src/logics/Interfaces/repositories/database/IReminderRepository";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";

@injectable()
export class ReminderLogic implements IReminderLogic {
	@inject(RepoTypes.ReminderRepository)
	private readonly reminderRepository!: IReminderRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction<TransactionLike>;

	async create(
		channelId: DiscordChannelId,
		userId: DiscordUserId,
		receiveUserName: ReceiveDiscordUserName,
		message: ReminderMessage,
		remindAt: RemindTime,
	): Promise<string> {
		if (dayjs(remindAt.getValue()).isBefore(dayjs())) {
			return "過去の日付のリマインドは設定できないよ！っ";
		}
		return this.transaction.startTransaction(async () => {
			await this.reminderRepository.create(
				channelId,
				userId,
				receiveUserName,
				message,
				remindAt,
			);
			return "リマインドの投稿を予約したよ！っ";
		});
	}
	list(userId: DiscordUserId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			const reminders = await this.reminderRepository.findByUserId(userId);
			if (!reminders || reminders.length <= 0) {
				return "リマインドは予約されていないよ！っ";
			}
			return reminders
				.flatMap((r) => [
					`- id: ${r.id.getValue()}`,
					`  - ${dayjs(r.remindAt.getValue().toLocaleString()).add(9, "h").format("YYYY-MM-DD HH:mm:ss")}`,
					`  - ${r.message.getValue()}`,
				])
				.join("\n");
		});
	}
	delete(id: ReminderId, userId: DiscordUserId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			const success = await this.reminderRepository.deleteReminder(id, userId);
			if (!success) return "リマインドの予約はされていなかったよ！っ";
			return "リマインドの予約を削除したよ！っ";
		});
	}
}
