import type { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserCommunityId } from "@/src/entities/vo/UserCommunityId";

export class UserDto {
	constructor(
		public categoryType: UserCategoryType,
		public clientId: UserClientId,
		public communityId: UserCommunityId,
	) {}
}
