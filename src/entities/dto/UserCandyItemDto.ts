import type { CandyId } from "@/src/entities/vo/CandyId";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { UserCandyItemExpire } from "@/src/entities/vo/UserCandyItemExpire";
import type { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";
export class UserCandyItemDto {
	constructor(
		public id: UserCandyItemId,
		public communityId: CommunityId,
		public userId: UserId,
		public itemId: CandyItemId,
		public candyId: CandyId,
		public expiredAt: UserCandyItemExpire,
	) {}
}
