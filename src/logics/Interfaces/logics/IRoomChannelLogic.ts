import type { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";

export interface IRoomChannelLogic {
	create(data: RoomChannelDto): Promise<boolean>;
	find(data: RoomChannelDto): Promise<RoomChannelDto| undefined>;
	delete(data: RoomChannelDto): Promise<boolean>;
}
