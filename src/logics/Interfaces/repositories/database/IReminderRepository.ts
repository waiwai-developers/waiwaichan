import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
<<<<<<< Updated upstream
import type { UserId } from "@/src/entities/vo/UserId";
=======
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
>>>>>>> Stashed changes
import type { ReminderId } from "@/src/entities/vo/ReminderId";

export interface IReminderRepository {
	create(data: ReminderDto): Promise<boolean>;
	deleteReminder(
		id: ReminderId,
		communityId: CommunityId,
<<<<<<< Updated upstream
		userId: UserId,
	): Promise<boolean>;
	findByUserId(
		communityId: CommunityId,
		userId: UserId,
=======
		userId: DiscordUserId,
	): Promise<boolean>;
	findByUserId(
		communityId: CommunityId,
		userId: DiscordUserId,
>>>>>>> Stashed changes
	): Promise<ReminderDto[]>;
}
