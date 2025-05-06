import type { CandyAmount } from "@/src/entities/vo/CandyAmount";
import type { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import type { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";

export interface ICandyLogic {
	check(guildId: DiscordGuildId, userId: DiscordUserId): Promise<string>;
	exchange(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<string>;
	drawItems(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		candyCount?: CandyCount,
	): Promise<string>;
	getItems(guildId: DiscordGuildId, userId: DiscordUserId): Promise<string>;
	giveCandys(
		guildId: DiscordGuildId,
		receiver: DiscordUserId,
		giver: DiscordUserId,
		messageId: DiscordMessageId,
		messageLink: DiscordMessageLink,
		candyCategoryType: CandyCategoryType,
	): Promise<string | undefined>;
}
