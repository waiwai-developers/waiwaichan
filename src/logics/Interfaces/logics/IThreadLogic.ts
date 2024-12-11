import type { ThreadDto } from "@/src/entities/dto/ThreadDto";
import type { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import type { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";

export interface IThreadLogic {
	create(data: ThreadDto): Promise<boolean>;
	find(threadGuildId: ThreadGuildId, messageId: ThreadMessageId): Promise<ThreadDto | undefined>;
}
