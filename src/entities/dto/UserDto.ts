import type { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { UserType } from "@/src/entities/vo/UserType";

export class UserDto {
	constructor(
		public categoryType: UserCategoryType,
		public clientId: UserClientId,
		public userType: UserType,
		public communityId: UserCommunityId,
	) {}
}
