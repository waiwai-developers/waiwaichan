import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { PredefinedRoleCommandIsAllow } from "@/src/entities/vo/PredefinedRoleCommandIsAllow";
import type { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";

export class PredefinedRoleCommandDto {
	constructor(
		public predefinedRolesId: PredefinedRoleId,
		public commandCategoryType: CommandCategoryType,
		public commandType: CommandType,
		public isAllow: PredefinedRoleCommandIsAllow,
	) {}
}
