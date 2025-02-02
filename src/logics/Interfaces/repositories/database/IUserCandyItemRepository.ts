import type { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import type { UserCandyItemWithItemGroupByDto } from "@/src/entities/dto/UserCandyItemWithItemGroupByDto";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import type { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";

export interface IUserCandyItemRepository {
	create(data: UserCandyItemDto): Promise<UserCandyItemId>;
	findByNotUsed(
		userId: DiscordUserId,
	): Promise<UserCandyItemWithItemGroupByDto[]>;

	exchangeByTypeAndAmount(
		userId: DiscordUserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<number>;
}
