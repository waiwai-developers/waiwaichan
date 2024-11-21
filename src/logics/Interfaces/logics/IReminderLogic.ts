import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ReminderId } from "@/src/entities/vo/ReminderId";

export interface IReminderLogic {
	create(data: ReminderDto): Promise<string>;
	list(userId: DiscordUserId): Promise<string>;
	delete(id: ReminderId, userId: DiscordUserId): Promise<string>;
}
