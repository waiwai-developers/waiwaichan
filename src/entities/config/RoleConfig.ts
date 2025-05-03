import json from "../../../config/role.json" with { type: "json" };
interface UserAssociation {
	discordId: string;
	role: string;
}

interface RoleConfigType {
	users: Array<UserAssociation>;
}

export const RoleConfig: RoleConfigType = json;
