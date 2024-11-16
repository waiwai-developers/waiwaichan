import * as process from "node:process";
import { DatabaseConfig } from "@/entities/config/DatabaseConfig";
import { type Dialect, Sequelize } from "sequelize";

export class MysqlConnector {
	private static instance: MysqlConnector;
	public db: Sequelize;
	private constructor(sequelize: Sequelize) {
		this.db = sequelize;
	}
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
	static getInstance(): MysqlConnector {
		if (MysqlConnector.instance == null) {
			const dbConfig = MysqlConnector.getDbConfig();
			new MysqlConnector(
				new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
					host: dbConfig.host,
					port: dbConfig.port,
					dialect: dbConfig.dialect as Dialect,
				}),
			);
		}
		return MysqlConnector.instance;
	}
}
