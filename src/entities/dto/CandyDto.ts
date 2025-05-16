import type { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import type { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { CommunityId } from "../vo/CommunityId";
import { UserId } from "../vo/UserId";

export class CandyDto {
	constructor(
		public communityId: CommunityId,
		public userId: UserId,
		public giveUserId: UserId,
		public messageId: DiscordMessageId,
		public categoryType: CandyCategoryType,
		public expiredAt: CandyExpire,
	) {}
}
