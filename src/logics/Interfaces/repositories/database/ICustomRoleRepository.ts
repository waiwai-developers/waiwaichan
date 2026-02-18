import type { CustomRoleDto } from "@/src/entities/dto/CustomRoleDto";
import type { CustomRoleCommunityId } from "@/src/entities/vo/CustomRoleCommunityId";
import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { CustomRoleName } from "@/src/entities/vo/CustomRoleName";

export interface ICustomRoleRepository {
	create(
		communityId: CustomRoleCommunityId,
		name: CustomRoleName,
	): Promise<CustomRoleId | undefined>;
	deleteById(id: CustomRoleId): Promise<boolean>;
	findById(id: CustomRoleId): Promise<CustomRoleDto | undefined>;
	findByName(
		communityId: CustomRoleCommunityId,
		name: CustomRoleName,
	): Promise<CustomRoleDto | undefined>;
	findAllByCommunityId(
		communityId: CustomRoleCommunityId,
	): Promise<CustomRoleDto[]>;
}
