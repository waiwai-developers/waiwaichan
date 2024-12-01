import process from "node:process";
import json from "@/config/database.json" with { type: "json" };

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
	test: DatabaseConfigType;
	production: DatabaseConfigType;
}

export const GetEnvDBConfig = () => {
	switch (process.env.NODE_ENV || "development") {
		case "test":
			return DatabaseConfig.test;
		case "production":
			return DatabaseConfig.production;
		default:
			return DatabaseConfig.development;
	}
};

export const DatabaseConfig: DatabaseJsonType = json;
