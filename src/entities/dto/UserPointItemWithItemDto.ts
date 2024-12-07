import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { PointItemDescription } from "@/src/entities/vo/PointItemDescription";
import type { PointItemId } from "@/src/entities/vo/PointItemId";
import type { PointItemName } from "@/src/entities/vo/PointItemName";
import type { UserPointItemExpire } from "@/src/entities/vo/UserPointItemExpire";
import type { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
export class UserPointItemWithItemDto {
	constructor(
		public id: UserPointItemId,
		public userId: DiscordUserId,
		public itemId: PointItemId,
		public expiredAt: UserPointItemExpire,
		public name: PointItemName,
		public description: PointItemDescription,
	) {}
}
