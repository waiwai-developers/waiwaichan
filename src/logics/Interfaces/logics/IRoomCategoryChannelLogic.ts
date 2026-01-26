import type { RoomCategoryChannelDto } from "@/src/entities/dto/RoomCategoryChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface IRoomCategoryChannelLogic {
	create(data: RoomCategoryChannelDto): Promise<string>;
	find(communityId: CommunityId): Promise<RoomCategoryChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<string>;
}
