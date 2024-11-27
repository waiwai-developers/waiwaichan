import type { DatabaseConfigType } from "@/src/entities/config/DatabaseConfig";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { Sequelize } from "sequelize-typescript";
import { SequelizeStorage, Umzug } from "umzug";

export const migrator = (dbConfig?: DatabaseConfigType | undefined) => {
	const sequelize =
		dbConfig != null
			? new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
					host: dbConfig.host,
					port: dbConfig.port,
					dialect: "mysql",
				})
			: new MysqlConnector().getDBInstance();
	return new Umzug({
		migrations: {
			glob: "migrator/migrations/*.ts",
		},
		context: sequelize,
		storage: new SequelizeStorage({
			sequelize,
			modelName: "umzug_migrator_meta",
		}),
		logger: console,
	});
};

export const seeder = (dbConfig?: DatabaseConfigType | undefined) => {
	const sequelize =
		dbConfig != null
			? new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
					host: dbConfig.host,
					port: dbConfig.port,
					dialect: "mysql",
				})
			: new MysqlConnector().getDBInstance();
	return new Umzug({
		migrations: {
			glob: "migrator/seeds/*.ts",
		},
		context: sequelize,
		storage: new SequelizeStorage({
			sequelize,
			modelName: "umzug_seeder_meta",
		}),
		logger: console,
	});
};

export type Migration = typeof Umzug.prototype._types.migration;
export type Seed = Migration;
