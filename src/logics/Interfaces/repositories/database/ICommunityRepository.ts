import type { CommunityDto } from "@/src/entities/dto/CommunityDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface ICommunityRepository {
	create(data: CommunityDto): Promise<boolean>;
	delete(data: CommunityDto): Promise<boolean>;
	getId(data: CommunityDto): Promise<CommunityId | undefined>;
}
