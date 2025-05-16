import type { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import type { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import type { UserId } from "@/src/entities/vo/UserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";

export interface ICandyLogic {
	check(communityId: CommunityId, userId: UserId): Promise<string>;
	exchange(
		communityId: CommunityId,
		userId: UserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<string>;
	drawItems(
		communityId: CommunityId,
		userId: UserId,
		candyCount?: CandyCount,
	): Promise<string>;
	getItems(guildId: CommunityId, userId: UserId): Promise<string>;
	giveCandys(
		communityId: CommunityId,
		receiverUserId: UserId,
		giverUserId: UserId,
		messageId: DiscordMessageId,
		messageLink: DiscordMessageLink,
		candyCategoryType: CandyCategoryType,
	): Promise<string | undefined>;
}
