import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";

export class RoomNotificationChannelDto {
	constructor(
		public communityId: CommunityId,
		public channelId: DiscordChannelId,
	) {}
}
