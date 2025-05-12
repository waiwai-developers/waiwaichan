import type { CommunityDto } from "@/src/entities/dto/CommunityDto";

export interface ICommunityLogic {
	create(data: CommunityDto): Promise<boolean>;
	delete(data: CommunityDto): Promise<boolean>;
}
