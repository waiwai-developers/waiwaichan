import type { RoomCategoryChannelDto } from "@/src/entities/dto/RoomCategoryChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface IRoomCategoryChannelRepository {
	create(data: RoomCategoryChannelDto): Promise<boolean>;
	findOne(
		communityId: CommunityId,
	): Promise<RoomCategoryChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<boolean>;
}
