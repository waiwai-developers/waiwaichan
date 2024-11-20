import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { PointItemDescription } from "@/entities/vo/PointItemDescription";
import type { PointItemId } from "@/entities/vo/PointItemId";
import type { PointItemName } from "@/entities/vo/PointItemName";
import type { UserPointItemExpire } from "@/entities/vo/UserPointItemExpire";
import type { UserPointItemId } from "@/entities/vo/UserPointItemId";
import type { UserPointItemStatus } from "@/entities/vo/UserPointItemStatus";
export class UserPointItemWithItemDto {
	constructor(
		public id: UserPointItemId,
		public userId: DiscordUserId,
		public itemId: PointItemId,
		public status: UserPointItemStatus,
		public expiredAt: UserPointItemExpire,
		public name: PointItemName,
		public description: PointItemDescription,
	) {}
}
