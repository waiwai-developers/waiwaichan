import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import type { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";

export interface ICandyLogic {
	check(userId: DiscordUserId): Promise<string>;
	exchange(
		userId: DiscordUserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<string>;
	drawItem(userId: DiscordUserId): Promise<string>;
	drawSeriesItem(userId: DiscordUserId): Promise<string>;
	getItems(userId: DiscordUserId): Promise<string>;
	giveCandy(
		receiver: DiscordUserId,
		giver: DiscordUserId,
		messageId: DiscordMessageId,
		messageLink: DiscordMessageLink,
	): Promise<string | undefined>;
}
