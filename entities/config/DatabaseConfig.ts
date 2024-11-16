import json from "@/config/config.json" with { type: "json" };

interface DatabaseConfigType {
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
