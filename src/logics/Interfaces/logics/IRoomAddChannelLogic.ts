import type { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";

export interface IRoomAddChannelLogic {
	create(data: RoomAddChannelDto): Promise<string>;
	find(data: RoomAddChannelDto): Promise<RoomAddChannelDto | undefined>;
	delete(discordGuildId: DiscordGuildId): Promise<string>;
}
