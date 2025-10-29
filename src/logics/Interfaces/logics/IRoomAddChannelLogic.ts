import type { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";

export interface IRoomAddChannelLogic {
	create(data: RoomAddChannelDto): Promise<string>;
	find(data: RoomAddChannelDto): Promise<RoomAddChannelDto | undefined>;
	delete(data: RoomAddChannelDto): Promise<string>;
}
