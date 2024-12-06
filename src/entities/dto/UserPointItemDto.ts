import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { PointItemId } from "@/src/entities/vo/PointItemId";
import type { UserPointItemExpire } from "@/src/entities/vo/UserPointItemExpire";
import type { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
import type { UserPointItemStatus } from "@/src/entities/vo/UserPointItemStatus";
export class UserPointItemDto {
	constructor(
		public id: UserPointItemId,
		public userId: DiscordUserId,
		public itemId: PointItemId,
		public expiredAt: UserPointItemExpire,
	) {}
}
