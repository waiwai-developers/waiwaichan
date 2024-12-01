import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import type { RemindTime } from "@/src/entities/vo/RemindTime";
import type { ReminderId } from "@/src/entities/vo/ReminderId";
import type { ReminderMessage } from "@/src/entities/vo/ReminderMessage";

export interface IReminderRepository {
	create(data: ReminderDto): Promise<boolean>;
	deleteReminder(id: ReminderId, userId: DiscordUserId): Promise<boolean>;
	findByUserId(userId: DiscordUserId): Promise<ReminderDto[]>;
}
