import type { ColumnDto } from "@/src/entities/dto/Column";

export interface IDataDeletionCircular {
	deleteRecordInRelatedTable(
		data: ColumnDto
	): Promise<boolean>;
}
