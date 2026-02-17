import type { RolePredefinedRoleDto } from "@/src/entities/dto/RolePredefinedRoleDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export interface IRolePredefinedRoleRepository {
	create(data: RolePredefinedRoleDto): Promise<boolean>;
	deleteByRoleId(roleId: RoleId, communityId: CommunityId): Promise<boolean>;
	findByRoleId(
		roleId: RoleId,
		communityId: CommunityId,
	): Promise<RolePredefinedRoleDto | undefined>;
}
