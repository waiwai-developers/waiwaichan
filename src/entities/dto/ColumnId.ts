import type { ColumnId } from "@/src/entities/vo/ColumnId";
import type { ColumnName } from "@/src/entities/vo/ColumnName";

export class ColumnCommunityDto {
	constructor(
		public readonly columnName: ColumnName,
		public readonly communityId: ColumnId,
	) {}
}
