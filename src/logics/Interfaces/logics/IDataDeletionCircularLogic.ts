import type { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface IDataDeletionCircularLogic {
	deleteRecordInRelatedTableCommunityId(
		id: CommunityId,
		clientId: CommunityClientId,
	): Promise<boolean>;
	deleteRecordInRelatedTableUserId(
		id: UserId,
		clientId: UserClientId,
	): Promise<boolean>;
}
