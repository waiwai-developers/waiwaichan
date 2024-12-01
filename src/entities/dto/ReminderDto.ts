import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import type { RemindTime } from "@/src/entities/vo/RemindTime";
import type { ReminderId } from "@/src/entities/vo/ReminderId";
import type { ReminderMessage } from "@/src/entities/vo/ReminderMessage";

export class ReminderDto {
	constructor(
		public id: ReminderId | undefined,
		public channelId: DiscordChannelId,
		public userId: DiscordUserId,
		public receiveUserName: ReceiveDiscordUserName,
		public message: ReminderMessage,
		public remindAt: RemindTime,
	) {}
}
