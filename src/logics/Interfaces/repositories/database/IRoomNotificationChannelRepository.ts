import type { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";

export interface IRoomNotificationChannelRepository {
	create(data: RoomNotificationChannelDto): Promise<boolean>;
	findOne(data: RoomNotificationChannelDto): Promise<RoomNotificationChannelDto | undefined>;
	delete(data: RoomNotificationChannelDto): Promise<boolean>;
}
