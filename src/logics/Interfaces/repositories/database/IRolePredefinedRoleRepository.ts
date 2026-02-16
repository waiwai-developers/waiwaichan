import type { RolePredefinedRoleDto } from "@/src/entities/dto/RolePredefinedRoleDto";
import type { RoleId } from "@/src/entities/vo/RoleId";

export interface IRolePredefinedRoleRepository {
	create(data: RolePredefinedRoleDto): Promise<boolean>;
	deleteByRoleId(roleId: RoleId): Promise<boolean>;
	findByRoleId(roleId: RoleId): Promise<RolePredefinedRoleDto | undefined>;
}
