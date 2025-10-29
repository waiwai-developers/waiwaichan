import type { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";

export interface IRoomNotificationChannelLogic {
	create(data: RoomNotificationChannelDto): Promise<string>;
	find(data: RoomNotificationChannelDto): Promise<RoomNotificationChannelDto | undefined>;
	delete(data: RoomNotificationChannelDto): Promise<string>;
}
