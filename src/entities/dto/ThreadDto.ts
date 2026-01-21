import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import type { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import type { ThreadMetadata } from "@/src/entities/vo/ThreadMetadata";

export class ThreadDto {
	constructor(
		public communityId: CommunityId,
		public messageId: ThreadMessageId,
		public categoryType: ThreadCategoryType,
		public metadata: ThreadMetadata,
	) {}
}
