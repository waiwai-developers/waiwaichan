import type { PointDto } from "../../../entities/dto/PointDto";
import type { ReminderDto } from "../../../entities/dto/ReminderDto";
import type { DiscordUserId } from "../../../entities/vo/DiscordUserId";
import type { PointCount } from "../../../entities/vo/PointCount";
import type { ReminderId } from "../../../entities/vo/ReminderId";

export interface IPointRepository {
	create(data: ReminderDto): Promise<boolean>;
	deleteReminder(id: ReminderId): Promise<boolean>;
	findByUserId(userId: DiscordUserId): Promise<ReminderDto[]>;
}
