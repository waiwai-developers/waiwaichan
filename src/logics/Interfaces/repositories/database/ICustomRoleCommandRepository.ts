import type { CustomRoleCommandDto } from "@/src/entities/dto/CustomRoleCommandDto";
import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { CustomRoleCommandCommunityId } from "@/src/entities/vo/CustomRoleCommandCommunityId";
import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";

export interface ICustomRoleCommandRepository {
	updateOrCreate(data: CustomRoleCommandDto): Promise<boolean>;
	deleteByCustomRoleId(
		communityId: CustomRoleCommandCommunityId,
		customRoleId: CustomRoleId,
	): Promise<boolean>;
	findByCustomRoleIdAndCommand(
		communityId: CustomRoleCommandCommunityId,
		customRoleId: CustomRoleId,
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<CustomRoleCommandDto | undefined>;
	checkCommandPermission(
		customRoleIds: CustomRoleId[],
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<boolean>;
	findAllByCustomRoleId(
		communityId: CustomRoleCommandCommunityId,
		customRoleId: CustomRoleId,
	): Promise<CustomRoleCommandDto[]>;
}
