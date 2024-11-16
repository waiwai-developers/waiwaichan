import type { PointDto } from "../../../../entities/dto/PointDto";
import type { ReminderDto } from "../../../../entities/dto/ReminderDto";
import type { DiscordUserId } from "../../../../entities/vo/DiscordUserId";
import type { PointCount } from "../../../../entities/vo/PointCount";

export interface IReminderSchedulerRepository {
	findByRemindTime(): Promise<ReminderDto[]>;
}
