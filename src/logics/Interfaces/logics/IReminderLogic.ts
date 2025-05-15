import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { ReminderId } from "@/src/entities/vo/ReminderId";

export interface IReminderLogic {
	create(data: ReminderDto): Promise<string>;
	list(communityId: CommunityId, userId: UserId): Promise<string>;
	delete(
		id: ReminderId,
		communityId: CommunityId,
		userId: UserId,
	): Promise<string>;
}
