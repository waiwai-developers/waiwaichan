import type { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import type { UserCandyItemWithItemGroupByDto } from "@/src/entities/dto/UserCandyItemWithItemGroupByDto";
import type { CandyId } from "@/src/entities/vo/CandyId";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import type { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";

export interface IUserCandyItemRepository {
	bulkCreate(data: UserCandyItemDto[]): Promise<UserCandyItemId[]>;
	findByNotUsed(
		userId: DiscordUserId,
	): Promise<UserCandyItemWithItemGroupByDto[]>;
	lastJackpodCandyId(userId: DiscordUserId): Promise<CandyId | undefined>;
	exchangeByTypeAndAmount(
		userId: DiscordUserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<number>;
}
