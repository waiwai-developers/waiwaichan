import type { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { CandyItemName } from "@/src/entities/vo/CandyItemName";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import type { UserCandyItemMinExpire } from "@/src/entities/vo/UserCandyItemMinExpire";
import type { UserCandyItemMinId } from "@/src/entities/vo/UserCandyItemMinId";
import type { UserId } from "@/src/entities/vo/UserId";
export class UserCandyItemWithItemGroupByDto {
	constructor(
		public userId: UserId,
		public itemId: CandyItemId,
		public name: CandyItemName,
		public description: CandyItemDescription,
		public count: UserCandyItemCount,
		public minId: UserCandyItemMinId,
		public minExpiredAt: UserCandyItemMinExpire,
	) {}
}
