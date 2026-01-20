import type { CommunityId } from "@/src/entities/vo/CommunityId";

export class ColumnCommunityDto {
    readonly columnName: "community" = "community";

    constructor(
        public readonly communityId: CommunityId,
    ) {}
}