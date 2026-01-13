import type { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";

export interface IRoomChannelRepository {
	create(data: RoomChannelDto): Promise<boolean>;
	findOne(data: RoomChannelDto): Promise<RoomChannelDto | undefined>;
	delete(data: RoomChannelDto): Promise<boolean>;
}
