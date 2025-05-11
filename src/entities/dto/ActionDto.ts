import type { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import type { CommunityClientId } from "@/src/entities/vo/CommunityClientId";

export class ActionDto {
	constructor(
		public categoryType: CommunityCategoryType,
		public clientId: CommunityClientId,
	) {}
}
