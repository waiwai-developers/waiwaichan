import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { CustomRoleCommandIsAllow } from "@/src/entities/vo/CustomRoleCommandIsAllow";
import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";

export class CustomRoleCommandDto {
	constructor(
		public customRoleId: CustomRoleId,
		public commandCategoryType: CommandCategoryType,
		public commandType: CommandType,
		public isAllow: CustomRoleCommandIsAllow,
	) {}
}
