import type { ReminderDto } from "@/entities/dto/ReminderDto";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { ReminderId } from "@/entities/vo/ReminderId";

export interface IReminderRepository {
	create(data: ReminderDto): Promise<boolean>;
	deleteReminder(id: ReminderId): Promise<boolean>;
	findByUserId(userId: DiscordUserId): Promise<ReminderDto[]>;
}
