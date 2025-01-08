import type { ThreadDto } from "@/src/entities/dto/ThreadDto";
import type { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import type { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";

export interface IThreadLogic {
	create(data: ThreadDto): Promise<boolean>;
	find(
		threadGuildId: ThreadGuildId,
		messageId: ThreadMessageId,
	): Promise<ThreadDto | undefined>;
}
