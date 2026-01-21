import type { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface IRoomNotificationChannelRepository {
	create(data: RoomNotificationChannelDto): Promise<boolean>;
	findOne(
		communityId: CommunityId,
	): Promise<RoomNotificationChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<boolean>;
}
