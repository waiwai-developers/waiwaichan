import { DiscordUserId } from "../vo/DiscordUserId";
import { PointItemId } from "../vo/PointItemId";
import { UserPointItemExpire } from "../vo/UserPointItemExpire";
import { UserPointItemId } from "../vo/UserPointItemId";
import { UserPointItemStatus } from "../vo/UserPointItemStatus";
export class UserPointItemDto {
	constructor(
		public id: UserPointItemId,
		public userId: DiscordUserId,
		public itemId: PointItemId,
		public status: UserPointItemStatus,
		public expiredAt: UserPointItemExpire,
	) {}
	static from(
		id: number,
		userId: number,
		itemId: number,
		status: boolean,
		expiredAt: Date,
	): UserPointItemDto {
		return new UserPointItemDto(
			new UserPointItemId(id),
			new DiscordUserId(userId),
			new PointItemId(itemId),
			new UserPointItemStatus(status),
			new UserPointItemExpire(expiredAt),
		);
	}
}
