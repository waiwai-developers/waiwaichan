import type { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import type { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import type { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";

export class ThreadDto {
	constructor(
		public guildId: ThreadGuildId,
		public messageId: ThreadMessageId,
		public categoryType: ThreadCategoryType,
	) {}
}
