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

export const DatabaseConfig: DatabaseJsonType = json;
