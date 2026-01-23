import type { ChannelId } from "@/src/entities/vo/ChannelId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface IDataDeletionCircularLogic {
	deleteRecordInRelatedTableCommunityId(
		communityId: CommunityId,
	): Promise<boolean>;
	deleteRecordInRelatedTableUserId(userId: UserId): Promise<boolean>;
	deleteRecordInRelatedTableChannelId(channelId: ChannelId): Promise<boolean>;
}
