import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export interface IPredefinedRoleLogic {
	bindRoleToPredefinedRole(
		roleId: RoleId,
		predefinedRoleId: PredefinedRoleId,
		communityId: CommunityId,
	): Promise<string>;
	releaseRoleFromPredefinedRole(
		roleId: RoleId,
		communityId: CommunityId,
	): Promise<string>;
	checkUserCommandPermission(
		communityId: CommunityId,
		userRoleClientIds: RoleClientId[],
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<boolean>;
}
