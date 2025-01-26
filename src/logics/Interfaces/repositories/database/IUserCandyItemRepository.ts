import type { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import type { UserCandyItemWithItemGroupByDto } from "@/src/entities/dto/UserCandyItemWithItemGroupByDto";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";

export interface IUserCandyItemRepository {
	create(data: UserCandyItemDto): Promise<UserCandyItemId>;
	findByNotUsed(
		userId: DiscordUserId,
	): Promise<UserCandyItemWithItemGroupByDto[]>;

	exchangeById(
		id: UserCandyItemId,
		userId: DiscordUserId,
	): Promise<UserCandyItemDto | null>;
}
