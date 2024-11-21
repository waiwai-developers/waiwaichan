import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { RemindTime } from "@/src/entities/vo/RemindTime";
import type { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { UserPointItemId } from "@/src/entities/vo/UserPointItemId";

export class ReminderDto {
	constructor(
		public id: UserPointItemId,
		public channelId: DiscordChannelId,
		public userId: DiscordUserId,
		public message: ReminderMessage,
		public remindAt: RemindTime,
	) {}
}
