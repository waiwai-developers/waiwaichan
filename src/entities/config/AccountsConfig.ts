import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

interface UserAssociation {
	githubId: string;
	discordId: string;
	grade: string;
}

interface AccountsConfigType {
	users: Array<UserAssociation>;
}

interface AccountsConfigTestJsonType {
	testing: AccountsConfigType;
}

const loadAccountsConfig = (): AccountsConfigType | null => {
	const configPath = "config/accounts.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

const loadAccountsTestConfig = (): AccountsConfigTestJsonType | null => {
	const configPath = "config/accountstest.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

export const GetEnvAccountsConfig = (): AccountsConfigType => {
	const env = process.env.NODE_ENV || "development";

	switch (env) {
		case "production":
		case "development": {
			const config = loadAccountsConfig();
			if (config) {
				return config;
			}
			throw new Error("Accounts configuration not found: config/accounts.json is required");
		}
		case "testing":
		default: {
			const testConfig = loadAccountsTestConfig();
			if (testConfig) {
				return testConfig.testing;
			}
			throw new Error("Accounts configuration not found: config/accountstest.json is required for testing environment");
		}
	}
};

export const AccountsConfig: AccountsConfigType = GetEnvAccountsConfig();
