import type { ThreadDto } from "@/src/entities/dto/ThreadDto";
import type { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";

export interface IThreadLogic {
	create(data: ThreadDto): Promise<boolean>;
	find(messageId: ThreadMessageId): Promise<ThreadDto | undefined>;
}
