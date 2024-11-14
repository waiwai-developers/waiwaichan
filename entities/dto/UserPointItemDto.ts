import { DiscordUserId } from "../vo/DiscordUserId";
import { PointItemId } from "../vo/PointItemId";
import { UserItemExpire } from "../vo/UserItemExpire";
import { UserItemId } from "../vo/UserItemId";
import { UserItemStatus } from "../vo/UserItemStatus";
export class UserPointItemDto {
	constructor(
		public id: UserItemId,
		public userId: DiscordUserId,
		public itemId: PointItemId,
		public status: UserItemStatus,
		public expiredAt: UserItemExpire,
	) {}
	static from(
		id: number,
		userId: number,
		itemId: number,
		status: boolean,
		expiredAt: Date,
	): UserPointItemDto {
		return new UserPointItemDto(
			new UserItemId(id),
			new DiscordUserId(userId),
			new PointItemId(itemId),
			new UserItemStatus(status),
			new UserItemExpire(expiredAt),
		);
	}
}
