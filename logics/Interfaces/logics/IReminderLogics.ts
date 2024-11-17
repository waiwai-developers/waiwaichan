import type { DiscordChannelId } from "@/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { RemindTime } from "@/entities/vo/RemindTime";
import type { ReminderId } from "@/entities/vo/ReminderId";

export interface IReminderLogics {
	create(
		channel: DiscordChannelId,
		userId: DiscordUserId,
		message: DiscordMessageId,
		remindAt: RemindTime,
	): string;
	list(userId: DiscordUserId): string;
	delete(id: ReminderId): string;
}
