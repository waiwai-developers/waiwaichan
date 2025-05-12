import type { CommunityDto } from "@/src/entities/dto/CommunityDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export interface ICommunityLogic {
	create(data: CommunityDto): Promise<CommunityId>;
	delete(data: CommunityDto): Promise<boolean>;
	getId(data: CommunityDto): Promise<CommunityId | undefined>;
}
