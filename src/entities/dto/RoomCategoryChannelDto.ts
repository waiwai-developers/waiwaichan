import type { ChannelId } from "@/src/entities/vo/ChannelId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export class RoomCategoryChannelDto {
	constructor(
		public communityId: CommunityId,
		public channelId: ChannelId,
	) {}
}
