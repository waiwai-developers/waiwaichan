import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ReminderId } from "@/src/entities/vo/ReminderId";

export interface IReminderRepository {
	create(data: ReminderDto): Promise<boolean>;
	deleteReminder(id: ReminderId, userId: DiscordUserId): Promise<boolean>;
	findByUserId(userId: DiscordUserId): Promise<ReminderDto[]>;
}
