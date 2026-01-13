import { existsSync, readFileSync } from "node:fs";

interface UserAssociation {
	githubId: string;
	discordId: string;
	grade: string;
}

interface AccountsConfigType {
	users: Array<UserAssociation>;
}

const loadAccountsConfig = (): AccountsConfigType | null => {
	const configPath = "config/accounts.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

export const GetEnvAccountsConfig = (): AccountsConfigType => {
	const config = loadAccountsConfig();
	if (config) {
		return config;
	}
	throw new Error("Accounts configuration not found: config/accounts.json is required");
};

export const AccountsConfig: AccountsConfigType = GetEnvAccountsConfig();
