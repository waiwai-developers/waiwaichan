import type { RoleCustomRoleDto } from "@/src/entities/dto/RoleCustomRoleDto";
import type { RoleId } from "@/src/entities/vo/RoleId";

export interface IRoleCustomRoleRepository {
	create(data: RoleCustomRoleDto): Promise<boolean>;
	deleteByRoleId(roleId: RoleId): Promise<boolean>;
	findByRoleId(roleId: RoleId): Promise<RoleCustomRoleDto | undefined>;
}
