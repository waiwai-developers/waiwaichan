import type { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import type { RoleId } from "@/src/entities/vo/RoleId";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface IPredefinedRoleLogic {
	bindRoleToPredefinedRole(
		roleId: RoleId,
		predefinedRoleId: PredefinedRoleId,
	): Promise<string>;
	releaseRoleFromPredefinedRole(roleId: RoleId): Promise<string>;
	checkUserCommandPermission(
		communityId: CommunityId,
		userRoleClientIds: RoleClientId[],
		commandCategoryType: number,
		commandType: number,
	): Promise<boolean>;
}
