import type { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import type { UserCandyItemWithItemGroupByDto } from "@/src/entities/dto/UserCandyItemWithItemGroupByDto";
import type { CandyId } from "@/src/entities/vo/CandyId";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import type { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";

export interface IUserCandyItemRepository {
	bulkCreate(data: UserCandyItemDto[]): Promise<UserCandyItemId[]>;
	findByNotUsed(
		communityId: CommunityId,
		userId: UserId,
	): Promise<UserCandyItemWithItemGroupByDto[]>;
	lastJackpodCandyId(
		communityId: CommunityId,
		userId: UserId,
	): Promise<CandyId | undefined>;
	exchangeByTypeAndAmount(
		communityId: CommunityId,
		userId: UserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<number>;
}
