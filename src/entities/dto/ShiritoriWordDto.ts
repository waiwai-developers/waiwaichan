import type { ShiritoriWordUserId } from "@/src/entities/vo/ShiritoriWordUserId";
import type { ShiritoriWordGuildId } from "@/src/entities/vo/ShiritoriWordGuildId";
import type { ShiritoriWordThreadId } from "@/src/entities/vo/ShiritoriWordThreadId";
import type { ShiritoriWordMessageId } from "@/src/entities/vo/ShiritoriWordMessageId";
import type { ShiritoriWordReadingWord } from "@/src/entities/vo/ShiritoriWordReadingWord";
import type { ShiritoriWordWritingWord } from "@/src/entities/vo/ShiritoriWordWritingWord";
import type { ShiritoriWordNextMessageId } from "@/src/entities/vo/ShiritoriWordNextMessageId";

export class ShiritoriWordDto {
	constructor(
		public userId: ShiritoriWordUserId,
		public guildId: ShiritoriWordGuildId,
		public threadId: ShiritoriWordThreadId,
		public messageId: ShiritoriWordMessageId,
		public readingWord: ShiritoriWordReadingWord,
		public writingWord: ShiritoriWordWritingWord,
		public nextMessageId: ShiritoriWordNextMessageId,
	) {}
}
