import type { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";

export interface IRoomNotificationChannelRepository {
	create(data: RoomNotificationChannelDto): Promise<boolean>;
	findOne(data: RoomNotificationChannelDto): Promise<RoomNotificationChannelDto | undefined>;
	delete(discordGuildId: DiscordGuildId): Promise<boolean>;
}
