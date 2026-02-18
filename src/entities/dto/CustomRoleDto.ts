import type { CustomRoleCommunityId } from "@/src/entities/vo/CustomRoleCommunityId";
import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { CustomRoleName } from "@/src/entities/vo/CustomRoleName";

export class CustomRoleDto {
	constructor(
		public id: CustomRoleId,
		public communityId: CustomRoleCommunityId,
		public name: CustomRoleName,
	) {}
}
