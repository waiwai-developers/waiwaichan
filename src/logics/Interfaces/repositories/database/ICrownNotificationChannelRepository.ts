import type { CrownNotificationChannelDto } from "@/src/entities/dto/CrownNotificationChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface ICrownNotificationChannelRepository {
	create(data: CrownNotificationChannelDto): Promise<boolean>;
	findOne(
		communityId: CommunityId,
	): Promise<CrownNotificationChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<boolean>;
}
