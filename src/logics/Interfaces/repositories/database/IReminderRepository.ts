import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ReminderId } from "@/src/entities/vo/ReminderId";

export interface IReminderRepository {
	create(data: ReminderDto): Promise<boolean>;
	deleteReminder(id: ReminderId, guild: DiscordGuildId, userId: DiscordUserId): Promise<boolean>;
	findByUserId(guild: DiscordGuildId, userId: DiscordUserId): Promise<ReminderDto[]>;
}
