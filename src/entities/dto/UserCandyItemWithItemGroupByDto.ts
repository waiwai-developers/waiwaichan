import type { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { CandyItemName } from "@/src/entities/vo/CandyItemName";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import type { UserCandyItemMinExpire } from "@/src/entities/vo/UserCandyItemMinExpire";
import type { UserCandyItemMinId } from "@/src/entities/vo/UserCandyItemMinId";
export class UserCandyItemWithItemGroupByDto {
	constructor(
		public userId: DiscordUserId,
		public itemId: CandyItemId,
		public name: CandyItemName,
		public description: CandyItemDescription,
		public count: UserCandyItemCount,
		public minId: UserCandyItemMinId,
		public minExpiredAt: UserCandyItemMinExpire,
	) {}
}
