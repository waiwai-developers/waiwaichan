import type { ReminderDto } from "@/entities/dto/ReminderDto";

export interface IReminderSchedulerRepository {
	findByRemindTime(): Promise<ReminderDto[]>;
}
