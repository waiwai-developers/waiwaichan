import type { ThreadDto } from "@/src/entities/dto/ThreadDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";

export interface IThreadRepository {
	create(data: ThreadDto): Promise<boolean>;
	findByMessageId(
		communityId: CommunityId,
		messageId: ThreadMessageId,
	): Promise<ThreadDto | undefined>;
}
