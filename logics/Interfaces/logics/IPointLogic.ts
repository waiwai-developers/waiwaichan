import type { DiscordMessageId } from "@/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { PointCount } from "@/entities/vo/PointCount";
import type { UserPointItemId } from "@/entities/vo/UserPointItemId";

export interface IPointLogic {
	check(userId: DiscordUserId): Promise<string>;
	exchange(
		userId: DiscordUserId,
		userPointItemId: UserPointItemId,
	): Promise<string>;
	drawItem(userId: DiscordUserId): Promise<string>;
	getItems(userId: DiscordUserId): Promise<string>;
	givePoint(
		receiver: DiscordUserId,
		giver: DiscordUserId,
		messageId: DiscordMessageId,
	): Promise<string | undefined>;
}
