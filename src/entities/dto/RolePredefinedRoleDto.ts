import type { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export class RolePredefinedRoleDto {
	constructor(
		public roleId: RoleId,
		public predefinedRoleId: PredefinedRoleId,
	) {}
}
