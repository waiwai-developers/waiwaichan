import { Sequelize } from "sequelize";
import config from "../config/config.json" with { type: "json" };

export const MysqlConnector = (() => {
	let instance;
	return {
		getInstance: () => {
			if (!instance) {
				instance = new Sequelize(
					config.database,
					config.username,
					config.password,
					{ host: config.host, port: config.port, dialect: config.dialect },
				);
			}
			return instance;
		},
	};
})();
