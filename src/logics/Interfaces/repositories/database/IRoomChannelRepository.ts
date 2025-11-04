import type { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";

export interface IRoomChannelRepository {
	create(data: RoomChannelDto): Promise<boolean>;
	delete(data: RoomChannelDto): Promise<boolean>;
}
