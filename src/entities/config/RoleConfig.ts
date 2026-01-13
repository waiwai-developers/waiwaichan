import { existsSync, readFileSync } from "node:fs";

interface UserAssociation {
	discordId: string;
	role: string;
}

interface RoleConfigType {
	users: Array<UserAssociation>;
}

interface RoleConfigTestJsonType {
	testing: RoleConfigType;
}

const loadRoleConfig = (): RoleConfigType | null => {
	const configPath = "config/role.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

const loadRoleTestConfig = (): RoleConfigTestJsonType | null => {
	const configPath = "config/roletest.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

export const GetEnvRoleConfig = (): RoleConfigType => {
	const config = loadRoleConfig();
	if (config) {
		return config;
	}
	throw new Error("Role configuration not found: config/role.json is required");
};

export const RoleConfig: RoleConfigType = GetEnvRoleConfig();
