import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { RoleCustomRoleCommunityId } from "@/src/entities/vo/RoleCustomRoleCommunityId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export class RoleCustomRoleDto {
	constructor(
		public communityId: RoleCustomRoleCommunityId,
		public roleId: RoleId,
		public customRoleId: CustomRoleId,
	) {}
}
