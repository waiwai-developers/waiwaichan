import type { CandyId } from "@/src/entities/vo/CandyId";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemExpire } from "@/src/entities/vo/UserCandyItemExpire";
import type { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";
export class UserCandyItemDto {
	constructor(
		public id: UserCandyItemId,
		public userId: DiscordUserId,
		public itemId: CandyItemId,
		public candyId: CandyId,
		public expiredAt: UserCandyItemExpire,
	) {}
}
