import type { CandyNotificationChannelDto } from "@/src/entities/dto/CandyNotificationChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface ICandyNotificationChannelRepository {
	create(data: CandyNotificationChannelDto): Promise<boolean>;
	findOne(
		communityId: CommunityId,
	): Promise<CandyNotificationChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<boolean>;
}
