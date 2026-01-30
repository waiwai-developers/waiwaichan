import type { CrownNotificationChannelDto } from "@/src/entities/dto/CrownNotificationChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface ICrownNotificationChannelLogic {
	create(data: CrownNotificationChannelDto): Promise<string>;
	find(
		communityId: CommunityId,
	): Promise<CrownNotificationChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<string>;
}
