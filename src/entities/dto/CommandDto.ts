import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandName } from "@/src/entities/vo/CommandName";
import type { CommandType } from "@/src/entities/vo/CommandType";

export class CommandDto {
	constructor(
		public commandCategoryType: CommandCategoryType,
		public commandType: CommandType,
		public name: CommandName,
	) {}
}
