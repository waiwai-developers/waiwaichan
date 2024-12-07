import type { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { CandyItemName } from "@/src/entities/vo/CandyItemName";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemExpire } from "@/src/entities/vo/UserCandyItemExpire";
import type { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";
export class UserCandyItemWithItemDto {
	constructor(
		public id: UserCandyItemId,
		public userId: DiscordUserId,
		public itemId: CandyItemId,
		public expiredAt: UserCandyItemExpire,
		public name: CandyItemName,
		public description: CandyItemDescription,
	) {}
}
