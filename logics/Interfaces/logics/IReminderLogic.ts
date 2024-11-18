import type { ReminderDto } from "@/entities/dto/ReminderDto";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { ReminderId } from "@/entities/vo/ReminderId";

export interface IReminderLogic {
	create(data: ReminderDto): Promise<string>;
	list(userId: DiscordUserId): Promise<string>;
	delete(id: ReminderId, userId: DiscordUserId): Promise<string>;
}
