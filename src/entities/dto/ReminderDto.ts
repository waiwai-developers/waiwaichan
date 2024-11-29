import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import type { RemindTime } from "@/src/entities/vo/RemindTime";
import type { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { ReminderStatus } from "@/src/entities/vo/ReminderStatus";
import type { UserPointItemId } from "@/src/entities/vo/UserPointItemId";

export class ReminderDto {
	constructor(
		public id: UserPointItemId,
		public channelId: DiscordChannelId,
		public userId: DiscordUserId,
		public receiveUserName: ReceiveDiscordUserName,
		public message: ReminderMessage,
		public status: ReminderStatus,
		public remindAt: RemindTime,
	) {}
}
