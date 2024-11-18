import * as process from "node:process";
import { DatabaseConfig } from "@/entities/config/DatabaseConfig";
import { type Dialect, Sequelize } from "sequelize";

// TODO define transaction interface with CLS
export class MysqlConnector {
	private static instance: Sequelize;
	private constructor(sequelize: Sequelize) {}
	private static getDbConfig() {
		switch (process.env.NODE_ENV || "development") {
			case "test":
				return DatabaseConfig.test;
			case "production":
				return DatabaseConfig.production;
			default:
				return DatabaseConfig.development;
		}
	}
	static getInstance(): Sequelize {
		if (MysqlConnector.instance == null) {
			const dbConfig = MysqlConnector.getDbConfig();
			MysqlConnector.instance = new Sequelize(
				dbConfig.database,
				dbConfig.username,
				dbConfig.password,
				{
					host: dbConfig.host,
					port: dbConfig.port,
					dialect: dbConfig.dialect as Dialect,
				},
			);
		}
		return MysqlConnector.instance;
	}
}
