import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { ReminderId } from "@/src/entities/vo/ReminderId";

export interface IReminderSchedulerRepository {
	findByRemindTime(): Promise<ReminderDto[]>;
	destoryReminder(id: ReminderId): Promise<boolean>;
}
