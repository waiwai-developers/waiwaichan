import type { ThreadDto } from "@/src/entities/dto/ThreadDto";
import type { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";

export interface IThreadRepository {
	create(data: ThreadDto): Promise<boolean>;
	findByMessageId(messageId: ThreadMessageId): Promise<ThreadDto | undefined>;
}
