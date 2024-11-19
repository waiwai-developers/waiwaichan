import type { ReminderDto } from "@/entities/dto/ReminderDto";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { ReminderId } from "@/entities/vo/ReminderId";
import type { IReminderLogic } from "@/logics/Interfaces/logics/IReminderLogic";
import type { IReminderRepository } from "@/logics/Interfaces/repositories/database/IReminderRepository";
import dayjs from "dayjs";

export class ReminderLogic implements IReminderLogic {
	constructor(
		private readonly reminderRepository: IReminderRepository,
		private readonly transaction: ITransaction<TransactionLike>,
	) {}

	async create(data: ReminderDto): Promise<string> {
		if (dayjs(data.remindAt.getValue()).isBefore(dayjs())) {
			return "過去の日付のリマインドは設定できないよ！っ";
		}
		return this.transaction.startTransaction(async () => {
			await this.reminderRepository.create(data);
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
