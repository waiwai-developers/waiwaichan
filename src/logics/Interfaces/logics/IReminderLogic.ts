import type { ReminderDto } from "@/src/entities/dto/ReminderDto";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ReminderId } from "@/src/entities/vo/ReminderId";

export interface IReminderLogic {
	create(data: ReminderDto): Promise<string>;
	list(guildId: DiscordGuildId, userId: DiscordUserId): Promise<string>;
	delete(
		id: ReminderId,
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<string>;
}
