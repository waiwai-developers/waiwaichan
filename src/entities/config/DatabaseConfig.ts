import { existsSync, readFileSync } from "node:fs";

export interface DatabaseConfigType {
	username: string;
	password: string;
	database: string;
	host: string;
	port: number;
	dialect: string;
}

interface DatabaseJsonType {
	development?: DatabaseConfigType;
	production?: DatabaseConfigType;
	testing?: DatabaseConfigType;
}

const loadDatabaseConfig = (): DatabaseJsonType | null => {
	const configPath = "config/database.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

export const GetEnvDatabaseConfig = (): DatabaseConfigType => {
	const config = loadDatabaseConfig();
	if (config) {
		const env = process.env.NODE_ENV || "production";
		const envConfig = config[env as keyof DatabaseJsonType];
		if (envConfig) {
			return envConfig;
		}
		// Fallback to production if specified env is not found
		if (config.production) {
			return config.production;
		}
	}
	throw new Error(
		"Database configuration not found: config/database.json is required for environment",
	);
};

export const DatabaseConfig: DatabaseConfigType = GetEnvDatabaseConfig();
