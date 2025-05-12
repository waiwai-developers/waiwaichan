import type { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserCommunityClientId } from "@/src/entities/vo/UserCommunityClientId";

export class UserDto {
	constructor(
		public categoryType: UserCategoryType,
		public clientId: UserClientId,
		public clientCommunityId: UserCommunityClientId,
	) {}
}
