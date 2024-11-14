import { Sequelize } from "sequelize";
const env = process.env.NODE_ENV || "development";
import config from "../../config/config.json";
const dbConfig = config[env];

export class MysqlConnector {
	private static instance: Sequelize;
	private constructor() {}
	static getInstance(): Sequelize {
		if (MysqlConnector.instance == null) {
			MysqlConnector.instance = new Sequelize(
				dbConfig.database,
				dbConfig.username,
				dbConfig.password,
				{
					host: dbConfig.host,
					port: dbConfig.port,
					dialect: dbConfig.dialect,
				},
			);
		}
		return MysqlConnector.instance;
	}
}
