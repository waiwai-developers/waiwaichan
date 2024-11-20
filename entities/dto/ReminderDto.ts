import type { DiscordChannelId } from "@/entities/vo/DiscordChannelId";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { RemindTime } from "@/entities/vo/RemindTime";
import type { ReminderMessage } from "@/entities/vo/ReminderMessage";
import type { UserPointItemId } from "@/entities/vo/UserPointItemId";

export class ReminderDto {
	constructor(
		public id: UserPointItemId,
		public channelId: DiscordChannelId,
		public userId: DiscordUserId,
		public message: ReminderMessage,
		public remindAt: RemindTime,
	) {}
}
