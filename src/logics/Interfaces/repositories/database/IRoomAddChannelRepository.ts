import type { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface IRoomAddChannelRepository {
	create(data: RoomAddChannelDto): Promise<boolean>;
	findOne(
		communityId: CommunityId,
	): Promise<RoomAddChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<boolean>;
}
