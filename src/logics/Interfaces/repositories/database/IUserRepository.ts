import type { UserDto } from "@/src/entities/dto/UserDto";
import type { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import type { UserClientId } from "@/src/entities/vo/UserClientId";

export interface IUserRepository {
	create(data: UserDto): Promise<boolean>;
	delete(
		categoryType: UserCategoryType,
		clientId: UserClientId,
	): Promise<boolean>;
}
