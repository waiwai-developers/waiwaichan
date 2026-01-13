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
	development: DatabaseConfigType;
	production: DatabaseConfigType;
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
		return config.production;
	}
	throw new Error("Database configuration not found: config/database.json is required for environment");
};

export const DatabaseConfig: DatabaseConfigType = GetEnvDatabaseConfig();
