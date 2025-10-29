import type { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";

export interface IRoomNotificationChannelLogic {
	create(data: RoomNotificationChannelDto): Promise<string>;
	find(discordGuildId: DiscordGuildId): Promise<RoomNotificationChannelDto | undefined>;
	delete(discordGuildId: DiscordGuildId): Promise<string>;
}
