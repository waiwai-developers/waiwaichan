import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

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
	const env = process.env.NODE_ENV || "development";

	switch (env) {
		case "production":
		case "development": {
			const config = loadRoleConfig();
			if (config) {
				return config;
			}
			throw new Error("Role configuration not found: config/role.json is required");
		}
		case "testing":
		default: {
			const testConfig = loadRoleTestConfig();
			if (testConfig) {
				return testConfig.testing;
			}
			throw new Error("Role configuration not found: config/roletest.json is required for testing environment");
		}
	}
};

export const RoleConfig: RoleConfigType = GetEnvRoleConfig();
