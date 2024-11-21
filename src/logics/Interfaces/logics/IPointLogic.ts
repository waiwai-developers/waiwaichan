import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserPointItemId } from "@/src/entities/vo/UserPointItemId";

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
