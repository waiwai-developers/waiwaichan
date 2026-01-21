import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
<<<<<<< Updated upstream
import type { UserId } from "@/src/entities/vo/UserId";
=======
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
>>>>>>> Stashed changes
import type { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import type { RemindTime } from "@/src/entities/vo/RemindTime";
import type { ReminderId } from "@/src/entities/vo/ReminderId";
import type { ReminderMessage } from "@/src/entities/vo/ReminderMessage";

export class ReminderDto {
	constructor(
		public id: ReminderId | undefined,
		public communityId: CommunityId,
		public channelId: DiscordChannelId,
		public userId: UserId,
		public receiveUserName: ReceiveDiscordUserName,
		public message: ReminderMessage,
		public remindAt: RemindTime,
	) {}
}
