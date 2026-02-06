import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export type DeletedRoleTargetDto = {
	id: RoleId;
	clientId: RoleClientId;
};
