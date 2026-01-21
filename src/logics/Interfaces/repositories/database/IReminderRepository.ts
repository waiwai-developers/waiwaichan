import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { ReminderId } from "@/src/entities/vo/ReminderId";

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
