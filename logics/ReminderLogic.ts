import type { ReminderDto } from "@/entities/dto/ReminderDto";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { ReminderId } from "@/entities/vo/ReminderId";
import type { IReminderLogic } from "@/logics/Interfaces/logics/IReminderLogic";
import type { IReminderRepository } from "@/logics/Interfaces/repositories/database/IReminderRepository";

export class ReminderLogic implements IReminderLogic {
	constructor(private readonly reminderRepository: IReminderRepository) {}

	create(data: ReminderDto): Promise<string> {
		throw new Error("Method not implemented.");
	}
	list(userId: DiscordUserId): Promise<string> {
		throw new Error("Method not implemented.");
	}
	delete(id: ReminderId, userId: DiscordUserId): Promise<string> {
		throw new Error("Method not implemented.");
	}
}
