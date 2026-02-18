import type { RoleCustomRoleDto } from "@/src/entities/dto/RoleCustomRoleDto";
import type { RoleCustomRoleCommunityId } from "@/src/entities/vo/RoleCustomRoleCommunityId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export interface IRoleCustomRoleRepository {
	create(data: RoleCustomRoleDto): Promise<boolean>;
	deleteByRoleId(
		communityId: RoleCustomRoleCommunityId,
		roleId: RoleId,
	): Promise<boolean>;
	findByRoleId(
		communityId: RoleCustomRoleCommunityId,
		roleId: RoleId,
	): Promise<RoleCustomRoleDto | undefined>;
}
