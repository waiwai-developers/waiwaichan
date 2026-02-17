import type { CustomRoleDto } from "@/src/entities/dto/CustomRoleDto";
import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { CustomRoleCommandIsAllow } from "@/src/entities/vo/CustomRoleCommandIsAllow";
import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { CustomRoleName } from "@/src/entities/vo/CustomRoleName";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export interface ICustomRoleLogic {
	getAllCustomRoles(communityId: CommunityId): Promise<CustomRoleDto[]>;
	createCustomRole(
		communityId: CommunityId,
		name: CustomRoleName,
	): Promise<string>;
	deleteCustomRole(
		communityId: CommunityId,
		id: CustomRoleId,
	): Promise<string>;
	bindRoleToCustomRole(
		communityId: CommunityId,
		roleId: RoleId,
		customRoleId: CustomRoleId,
	): Promise<string>;
	releaseRoleFromCustomRole(
		communityId: CommunityId,
		roleId: RoleId,
	): Promise<string>;
	updateCommandPermission(
		communityId: CommunityId,
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
