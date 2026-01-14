import type { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";

export interface IRoomNotificationChannelRepository {
	create(data: RoomNotificationChannelDto): Promise<boolean>;
	findOne(
		discordGuildId: DiscordGuildId,
	): Promise<RoomNotificationChannelDto | undefined>;
	delete(discordGuildId: DiscordGuildId): Promise<boolean>;
}
