import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface IDataDeletionCircular {
	deleteRecordInRelatedTableCommunityId(
		communityId: CommunityId,
	): Promise<boolean>;
	deleteRecordInRelatedTableUserId(userId: UserId): Promise<boolean>;
}
