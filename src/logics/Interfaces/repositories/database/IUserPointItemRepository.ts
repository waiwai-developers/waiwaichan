import type { UserPointItemDto } from "@/src/entities/dto/UserPointItemDto";
import type { UserPointItemWithItemDto } from "@/src/entities/dto/UserPointItemWithItemDto";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserPointItemId } from "@/src/entities/vo/UserPointItemId";

export interface IUserPointItemRepository {
	create(data: UserPointItemDto): Promise<UserPointItemId>;
	findByNotUsed(
		userId: DiscordUserId,
	): Promise<Array<UserPointItemWithItemDto>>;

	exchangeById(
		id: UserPointItemId,
		userId: DiscordUserId,
	): Promise<UserPointItemDto | null>;
}
