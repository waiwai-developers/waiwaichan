import { existsSync, readFileSync } from "node:fs";
import process from "node:process";

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

interface DatabaseConfigTestJsonType {
	testing: DatabaseConfigType;
}

const loadDatabaseConfig = (): DatabaseJsonType | null => {
	const configPath = "config/database.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

const loadDatabaseTestConfig = (): DatabaseConfigTestJsonType | null => {
	const configPath = "config/databasetest.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

export const GetEnvDatabaseConfig = (): DatabaseConfigType => {
	const env = process.env.NODE_ENV || "development";

	switch (env) {
		case "production": {
			const config = loadDatabaseConfig();
			if (config) {
				return config.production;
			}
			throw new Error("Database configuration not found: config/database.json is required for production environment");
		}
		case "development": {
			const config = loadDatabaseConfig();
			if (config) {
				return config.development;
			}
			throw new Error("Database configuration not found: config/database.json is required for development environment");
		}
		case "testing":
		default: {
			const testConfig = loadDatabaseTestConfig();
			if (testConfig) {
				return testConfig.testing;
			}
			throw new Error("Database configuration not found: config/databasetest.json is required for testing environment");
		}
	}
};

export const DatabaseConfig: DatabaseConfigType = GetEnvDatabaseConfig();
