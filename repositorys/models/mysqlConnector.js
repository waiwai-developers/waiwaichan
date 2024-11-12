import { Sequelize } from "sequelize";
const env = process.env.NODE_ENV || "development";
import config from "../../config/config.json" with { type: "json" };
const dbConfig = config[env];

export const MysqlConnector = (() => {
	let instance;
	return {
		getInstance: () => {
			if (!instance) {
				instance = new Sequelize(
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
			return instance;
		},
	};
})();
