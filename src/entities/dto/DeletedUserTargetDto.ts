import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserId } from "@/src/entities/vo/UserId";

export type DeletedUserTargetDto = {
	id: UserId;
	clientId: UserClientId;
};
