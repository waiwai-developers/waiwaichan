import type { CommunityDto } from "@/src/entities/dto/CommunityDto";
import type { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import type { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface ICommunityRepository {
	create(data: CommunityDto): Promise<CommunityId>;
	delete(data: CommunityDto): Promise<boolean>;
	getId(data: CommunityDto): Promise<CommunityId | undefined>;
	getNotExistClientId(
		categoryType: CommunityCategoryType,
		communityClientIds: CommunityClientId[],
	): Promise<CommunityClientId[]>;
}
