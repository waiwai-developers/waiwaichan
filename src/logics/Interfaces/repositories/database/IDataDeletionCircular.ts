import type { ColumnName } from "@/src/entities/vo/ColumnName";
import type { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface IDataDeletionCircular {
	deleteRecordInRelatedTable(
		columnNames: ColumnName[],
		ids: Array<CommunityId | CommunityClientId | UserId | UserClientId>,
	): Promise<boolean>;
}
