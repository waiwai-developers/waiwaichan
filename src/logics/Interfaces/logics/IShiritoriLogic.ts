import type { ShiritoriWordDto } from "@/src/entities/dto/ShiritoriWordDto";
import type { ShiritoriWordThreadId } from "@/src/entities/vo/ShiritoriWordThreadId";
import type { ShiritoriWordGuildId } from "@/src/entities/vo/ShiritoriWordGuildId";
import type { ShiritoriWordMessageId } from "@/src/entities/vo/ShiritoriWordMessageId";
import type { ShiritoriWordReadingWord } from "@/src/entities/vo/ShiritoriWordReadingWord";
import type { ShiritoriWordWritingWord } from "@/src/entities/vo/ShiritoriWordWritingWord";

export interface IShiritoriLogic {
	createWord(data: ShiritoriWordDto): Promise<string>;
	updateWord(
		guildId: ShiritoriWordGuildId,
		threadId: ShiritoriWordThreadId,
		messageId: ShiritoriWordMessageId,
		readingWord: ShiritoriWordReadingWord,
		writingWord: ShiritoriWordWritingWord,
	): Promise<string>;
	deleteWord(
		guildId: ShiritoriWordGuildId,
		threadId: ShiritoriWordThreadId,
		messageId: ShiritoriWordMessageId,
	): Promise<string>;
}
