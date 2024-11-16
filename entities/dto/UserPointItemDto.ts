import type { DiscordUserId } from "../vo/DiscordUserId";
import type { PointItemId } from "../vo/PointItemId";
import type { UserPointItemExpire } from "../vo/UserPointItemExpire";
import type { UserPointItemId } from "../vo/UserPointItemId";
import type { UserPointItemStatus } from "../vo/UserPointItemStatus";
export class UserPointItemDto {
	constructor(
		public id: UserPointItemId,
		public userId: DiscordUserId,
		public itemId: PointItemId,
		public status: UserPointItemStatus,
		public expiredAt: UserPointItemExpire,
	) {}
}
