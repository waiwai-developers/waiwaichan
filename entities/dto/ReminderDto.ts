import type { DiscordChannelId } from "@/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { RemindTime } from "@/entities/vo/RemindTime";
import type { UserPointItemId } from "@/entities/vo/UserPointItemId";

export class ReminderDto {
	constructor(
		public id: UserPointItemId,
		public channelId: DiscordChannelId,
		public userId: DiscordUserId,
		public messageId: DiscordMessageId,
		public remindAt: RemindTime,
	) {}
}
