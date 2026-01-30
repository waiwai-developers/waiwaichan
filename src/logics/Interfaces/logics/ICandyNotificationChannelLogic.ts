import type { CandyNotificationChannelDto } from "@/src/entities/dto/CandyNotificationChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface ICandyNotificationChannelLogic {
	create(data: CandyNotificationChannelDto): Promise<string>;
	find(
		communityId: CommunityId,
	): Promise<CandyNotificationChannelDto | undefined>;
	delete(communityId: CommunityId): Promise<string>;
}
