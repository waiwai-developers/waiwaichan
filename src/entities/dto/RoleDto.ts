import type { RoleCategoryType } from "@/src/entities/vo/RoleCategoryType";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";

export class RoleDto {
	constructor(
		public categoryType: RoleCategoryType,
		public clientId: RoleClientId,
		public communityId: RoleCommunityId,
	) {}
}
