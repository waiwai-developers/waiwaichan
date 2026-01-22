import type { ChannelId } from "@/src/entities/vo/ChannelId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import type { RemindTime } from "@/src/entities/vo/RemindTime";
import type { ReminderId } from "@/src/entities/vo/ReminderId";
import type { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { UserId } from "@/src/entities/vo/UserId";

export class ReminderDto {
	constructor(
		public id: ReminderId | undefined,
		public communityId: CommunityId,
		public channelId: ChannelId,
		public userId: UserId,
		public receiveUserName: ReceiveDiscordUserName,
		public message: ReminderMessage,
		public remindAt: RemindTime,
	) {}
}
