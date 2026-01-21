import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ReminderId } from "@/src/entities/vo/ReminderId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface IReminderRepository {
	create(data: ReminderDto): Promise<boolean>;
	deleteReminder(
		id: ReminderId,
		communityId: CommunityId,
		userId: UserId,
	): Promise<boolean>;
	findByUserId(
		communityId: CommunityId,
		userId: UserId,
	): Promise<ReminderDto[]>;
}
