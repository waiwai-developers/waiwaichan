import type { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";

export interface IRoomAddChannelRepository {
	create(data: RoomAddChannelDto): Promise<boolean>;
	findOne(
		discordGuildId: DiscordGuildId,
	): Promise<RoomAddChannelDto | undefined>;
	delete(discordGuildId: DiscordGuildId): Promise<boolean>;
}
