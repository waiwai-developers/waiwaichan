import type { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import type { PredefinedRoleName } from "@/src/entities/vo/PredefinedRoleName";

export class PredefinedRoleDto {
	constructor(
		public id: PredefinedRoleId,
		public name: PredefinedRoleName,
	) {}
}
