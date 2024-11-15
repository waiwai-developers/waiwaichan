import type { DiscordChannelId } from "../vo/DiscordChannelId";
import type { DiscordMessageId } from "../vo/DiscordMessageId";
import type { DiscordUserId } from "../vo/DiscordUserId";
import type { RemindTime } from "../vo/RemindTime";
import type { UserPointItemId } from "../vo/UserPointItemId";

export class ReminderDto {
	constructor(
		public id: UserPointItemId,
		public channelId: DiscordChannelId,
		public userId: DiscordUserId,
		public messageId: DiscordMessageId,
		public remindAt: RemindTime,
	) {}
}
