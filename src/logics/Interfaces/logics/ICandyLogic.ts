import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";

export interface ICandyLogic {
	check(userId: DiscordUserId): Promise<string>;
	exchange(
		userId: DiscordUserId,
		userCandyItemId: UserCandyItemId,
	): Promise<string>;
	drawItem(userId: DiscordUserId): Promise<string>;
	getItems(userId: DiscordUserId): Promise<string>;
	giveCandy(
		receiver: DiscordUserId,
		giver: DiscordUserId,
		messageId: DiscordMessageId,
		messageLink: DiscordMessageLink,
	): Promise<string | undefined>;
}
