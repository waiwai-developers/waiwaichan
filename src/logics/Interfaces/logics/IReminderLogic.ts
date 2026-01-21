import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
<<<<<<< Updated upstream
import type { UserId } from "@/src/entities/vo/UserId";
=======
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
>>>>>>> Stashed changes
import type { ReminderId } from "@/src/entities/vo/ReminderId";

export interface IReminderLogic {
	create(data: ReminderDto): Promise<string>;
<<<<<<< Updated upstream
	list(communityId: CommunityId, userId: UserId): Promise<string>;
	delete(
		id: ReminderId,
		communityId: CommunityId,
		userId: UserId,
=======
	list(communityId: CommunityId, userId: DiscordUserId): Promise<string>;
	delete(
		id: ReminderId,
		communityId: CommunityId,
		userId: DiscordUserId,
>>>>>>> Stashed changes
	): Promise<string>;
}
