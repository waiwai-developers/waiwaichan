import type { ReminderDto } from "@/entities/dto/ReminderDto";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { ReminderId } from "@/entities/vo/ReminderId";

export interface IReminderLogic {
	create(data: ReminderDto): string;
	list(userId: DiscordUserId): string;
	delete(id: ReminderId, userId: DiscordUserId): string;
}
