import type { UserPointItemDto } from "../../../entities/dto/UserPointItemDto";
import type { DiscordUserId } from "../../../entities/vo/DiscordUserId";
import type { UserPointItemId } from "../../../entities/vo/UserPointItemId";
import type { UserPointItemStatus } from "../../../entities/vo/UserPointItemStatus";

export interface IUserPointItemRepository {
	create(data: UserPointItemDto): Promise<UserPointItemId>;
	findByNotUsed(
		userId: DiscordUserId,
		userStatus: UserPointItemStatus,
	): Promise<UserPointItemDto[]>;
	exchangeById(id: UserPointItemId, userId: DiscordUserId): Promise<boolean>;
}