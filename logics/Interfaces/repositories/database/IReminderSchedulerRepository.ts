import type { ReminderDto } from "@/entities/dto/ReminderDto";
import type { ReminderId } from "@/entities/vo/ReminderId";

export interface IReminderSchedulerRepository {
	findByRemindTime(): Promise<ReminderDto[]>;
	deleteReminder(id: ReminderId): Promise<boolean>;
}
