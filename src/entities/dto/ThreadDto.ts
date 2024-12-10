import type { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import type { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";

export class ThreadDto {
	constructor(
		public messageId: ThreadMessageId,
		public categoryType: ThreadCategoryType,
	) {}
}
