import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { CustomRoleName } from "@/src/entities/vo/CustomRoleName";

export class CustomRoleDto {
	constructor(
		public id: CustomRoleId,
		public name: CustomRoleName,
	) {}
}
