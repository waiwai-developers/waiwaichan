import type { CommunityId } from "@/src/entities/vo/CommunityId";

export class ColumnCommunityDto {
	readonly columnName = "community" as const;

	constructor(public readonly communityId: CommunityId) {}
}
