import type { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";

export interface ICandyLogic {
	check(userId: DiscordUserId): Promise<string>;
	exchange(
		userId: DiscordUserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<string>;
	drawItems(userId: DiscordUserId, candyCount: CandyCount): Promise<string>;
	getItems(userId: DiscordUserId): Promise<string>;
	giveCandy(
		receiver: DiscordUserId,
		giver: DiscordUserId,
		messageId: DiscordMessageId,
		messageLink: DiscordMessageLink,
	): Promise<string | undefined>;
}
