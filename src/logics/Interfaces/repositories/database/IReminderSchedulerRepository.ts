import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { ReminderId } from "@/src/entities/vo/ReminderId";

export interface IReminderSchedulerRepository {
	findByRemindTime(): Promise<ReminderDto[]>;
	deleteReminder(id: ReminderId): Promise<boolean>;
}
