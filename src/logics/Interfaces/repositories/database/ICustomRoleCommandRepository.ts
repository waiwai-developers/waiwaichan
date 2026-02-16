import type { CustomRoleCommandDto } from "@/src/entities/dto/CustomRoleCommandDto";
import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";

export interface ICustomRoleCommandRepository {
	updateOrCreate(data: CustomRoleCommandDto): Promise<boolean>;
	deleteByCustomRoleId(customRoleId: CustomRoleId): Promise<boolean>;
	findByCustomRoleIdAndCommand(
		customRoleId: CustomRoleId,
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<CustomRoleCommandDto | undefined>;
	checkCommandPermission(
		customRoleIds: CustomRoleId[],
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<boolean>;
}
