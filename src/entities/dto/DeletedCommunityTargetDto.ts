import type { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";

export type DeletedCommunityTargetDto = {
	id: CommunityId;
	clientId: CommunityClientId;
};
