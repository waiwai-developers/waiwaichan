import type { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import type { RoleId } from "@/src/entities/vo/RoleId";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";

export interface IPredefinedRoleLogic {
	bindRoleToPredefinedRole(
		roleId: RoleId,
		predefinedRoleId: PredefinedRoleId,
	): Promise<string>;
	releaseRoleFromPredefinedRole(roleId: RoleId): Promise<string>;
	checkUserCommandPermission(
		communityId: CommunityId,
		userRoleClientIds: RoleClientId[],
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<boolean>;
}
