import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { CustomRoleCommandIsAllow } from "@/src/entities/vo/CustomRoleCommandIsAllow";
import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { CustomRoleName } from "@/src/entities/vo/CustomRoleName";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export interface ICustomRoleLogic {
	createCustomRole(name: CustomRoleName): Promise<string>;
	deleteCustomRole(id: CustomRoleId): Promise<string>;
	bindRoleToCustomRole(roleId: RoleId, customRoleId: CustomRoleId): Promise<string>;
	releaseRoleFromCustomRole(roleId: RoleId): Promise<string>;
	updateCommandPermission(
		customRoleId: CustomRoleId,
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
		isAllow: CustomRoleCommandIsAllow,
	): Promise<string>;
	checkUserCommandPermission(
		communityId: CommunityId,
		userRoleClientIds: RoleClientId[],
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<boolean>;
}
