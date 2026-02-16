import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export class RoleCustomRoleDto {
	constructor(
		public roleId: RoleId,
		public customRoleId: CustomRoleId,
	) {}
}
