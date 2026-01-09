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

interface DatabaseTestJsonType {
	testing: DatabaseConfigType;
}

const loadDatabaseConfig = (): DatabaseJsonType | null => {
	const configPath = "config/database.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

const loadDatabaseTestConfig = (): DatabaseTestJsonType | null => {
	const configPath = "config/databasetest.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

export const GetTestDBConfig = (): DatabaseConfigType | null => {
	const testConfig = loadDatabaseTestConfig();
	if (testConfig) {
		return testConfig.testing;
	}
	return null;
};

export const GetEnvDBConfig = (): DatabaseConfigType => {
	const env = process.env.NODE_ENV || "development";

	switch (env) {
		case "testing": {
			const testConfig = loadDatabaseTestConfig();
			if (testConfig) {
				return testConfig.testing;
			}
			throw new Error("Database configuration not found: config/databasetest.json is required for testing environment");
		}
		case "production": {
			const config = loadDatabaseConfig();
			if (config) {
				return config.production;
			}
			throw new Error("Database configuration not found: config/database.json is required for production environment");
		}
		case "development":
		default: {
			const config = loadDatabaseConfig();
			if (config) {
				return config.development;
			}
			throw new Error("Database configuration not found: config/database.json is required for development environment");
		}
	}
};

export const DatabaseConfig = loadDatabaseConfig() || {
	production: {} as DatabaseConfigType,
	development: {} as DatabaseConfigType,
	testing: {} as DatabaseConfigType,
};
