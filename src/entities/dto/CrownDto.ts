import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { MessageId } from "@/src/entities/vo/MessageId";

export class CrownDto {
	constructor(
		public communityId: CommunityId,
		public messageId: MessageId,
	) {}
}
