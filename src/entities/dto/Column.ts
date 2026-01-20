import type { ColumnName } from "@/src/entities/vo/ColumnName";
import type { ColumnId } from "@/src/entities/vo/ColumnId";

export class ColumnDto {
    constructor(
        public readonly columnName: ColumnName,
        public readonly columnId: ColumnId,
    ) {}
}