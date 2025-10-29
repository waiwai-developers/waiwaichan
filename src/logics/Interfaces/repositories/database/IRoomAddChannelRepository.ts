import type { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";

export interface IRoomAddChannelRepository {
	create(data: RoomAddChannelDto): Promise<boolean>;
	findOne(data: RoomAddChannelDto): Promise<RoomAddChannelDto | undefined>;
	delete(data: RoomAddChannelDto): Promise<boolean>;
}
