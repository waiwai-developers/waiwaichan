import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";

export interface IPredefinedRoleCommandRepository {
	checkCommandPermission(
		predefinedRoleIds: PredefinedRoleId[],
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<boolean>;
}
