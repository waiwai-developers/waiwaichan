import type { CustomRoleDto } from "@/src/entities/dto/CustomRoleDto";
import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { CustomRoleName } from "@/src/entities/vo/CustomRoleName";

export interface ICustomRoleRepository {
	create(name: CustomRoleName): Promise<CustomRoleId | undefined>;
	deleteById(id: CustomRoleId): Promise<boolean>;
	findById(id: CustomRoleId): Promise<CustomRoleDto | undefined>;
	findByName(name: CustomRoleName): Promise<CustomRoleDto | undefined>;
}
