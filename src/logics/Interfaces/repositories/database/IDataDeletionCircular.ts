import type { ColumnName } from "@/src/entities/vo/ColumnName";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface IDataDeletionCircular {
	deleteRecordInRelatedTable(
		columnName: ColumnName,
		id: CommunityId | UserId,
	): Promise<boolean>;
}
