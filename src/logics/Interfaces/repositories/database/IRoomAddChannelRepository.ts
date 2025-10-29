import type { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";

export interface IRoomAddChannelRepository {
	create(data: RoomAddChannelDto): Promise<boolean>;
	findOne(data: RoomAddChannelDto): Promise<RoomAddChannelDto | undefined>;
	delete(discordGuildId: DiscordGuildId): Promise<boolean>;
}
