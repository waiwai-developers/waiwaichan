import type { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";

export interface IRoomChannelLogic {
	create(data: RoomChannelDto): Promise<string>;
	delete(data: RoomChannelDto): Promise<string>;
}
