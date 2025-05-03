import type { ShiritoriWordDto } from "@/src/entities/dto/ShiritoriWordDto";
import type { ShiritoriWordGuildId } from "@/src/entities/vo/ShiritoriWordGuildId";
import type { ShiritoriWordMessageId } from "@/src/entities/vo/ShiritoriWordMessageId";
import type { ShiritoriWordReadingWord } from "@/src/entities/vo/ShiritoriWordReadingWord";
import type { ShiritoriWordWritingWord } from "@/src/entities/vo/ShiritoriWordWritingWord";
import type { ShiritoriWordNextMessageId } from "@/src/entities/vo/ShiritoriWordNextMessageId";
import type { ShiritoriWordThreadId } from "@/src/entities/vo/ShiritoriWordThreadId";

export interface IShiritoriWordRepository {
	createWord(data: ShiritoriWordDto): Promise<ShiritoriWordDto | undefined>;
	updateWord(
		guildId: ShiritoriWordGuildId,
		messageId: ShiritoriWordMessageId,
		readingWord: ShiritoriWordReadingWord,
		writingWord: ShiritoriWordWritingWord,
	): Promise<boolean>;
	updateBackWord(
		guildId: ShiritoriWordGuildId,
		messageId: ShiritoriWordMessageId,
		nextMessageId: ShiritoriWordNextMessageId,
	): Promise<boolean>;
	deleteWord(
		guildId: ShiritoriWordGuildId,
		messageId: ShiritoriWordMessageId,
	): Promise<boolean>;
	findThreadLatestWord(
		guildId: ShiritoriWordGuildId,
		threadId: ShiritoriWordThreadId,
	): Promise<ShiritoriWordDto | undefined>;
}
