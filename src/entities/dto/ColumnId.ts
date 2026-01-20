import type { ColumnName } from "@/src/entities/vo/ColumnName";
import type { ColumnId } from "@/src/entities/vo/ColumnId";

export class ColumnCommunityDto {
    constructor(
        public readonly columnName: ColumnName,
        public readonly communityId: ColumnId,
    ) {}
}