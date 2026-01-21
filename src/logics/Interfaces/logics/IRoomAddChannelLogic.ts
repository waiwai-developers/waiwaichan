import type { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface IRoomAddChannelLogic {
	create(data: RoomAddChannelDto): Promise<string>;
	find(communityId: CommunityId): Promise<RoomAddChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<string>;
}
