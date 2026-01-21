import type { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface IRoomNotificationChannelLogic {
	create(data: RoomNotificationChannelDto): Promise<string>;
	find(
		communityId: CommunityId,
	): Promise<RoomNotificationChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<string>;
}
