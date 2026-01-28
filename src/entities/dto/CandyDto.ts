import type { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import type { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { MessageId } from "@/src/entities/vo/MessageId";
import type { CommunityId } from "../vo/CommunityId";
import type { UserId } from "../vo/UserId";

export class CandyDto {
	constructor(
		public communityId: CommunityId,
		public userId: UserId,
		public giveUserId: UserId,
		public messageId: MessageId,
		public categoryType: CandyCategoryType,
		public expiredAt: CandyExpire,
	) {}
}
