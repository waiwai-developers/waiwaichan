import type { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import type { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import type { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import type { ChannelType } from "@/src/entities/vo/ChannelType";

export class ChannelDto {
	constructor(
		public categoryType: ChannelCategoryType,
		public clientId: ChannelClientId,
		public channelType: ChannelType,
		public communityId: ChannelCommunityId,
	) {}
}
