import type { ColumnId } from "@/src/entities/vo/ColumnId";
import type { ColumnName } from "@/src/entities/vo/ColumnName";

export class ColumnDto {
	constructor(
		public readonly columnName: ColumnName,
		public readonly columnId: ColumnId,
	) {}
}
