import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface IDataDeletionCircularLogic {
	deleteRecordInRelatedTableCommunityId(id: CommunityId): Promise<boolean>;
	deleteRecordInRelatedTableUserId(id: UserId): Promise<boolean>;
}
