import type { MessageCategoryType } from "@/src/entities/vo/MessageCategoryType";
import type { MessageClientId } from "@/src/entities/vo/MessageClientId";
import type { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import type { MessageUserId } from "@/src/entities/vo/MessageUserId";

export class MessageDto {
	constructor(
		public categoryType: MessageCategoryType,
		public clientId: MessageClientId,
		public communityId: MessageCommunityId,
		public userId: MessageUserId,
	) {}
}
