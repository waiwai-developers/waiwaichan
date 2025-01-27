import { DatafixCandyModel } from "@/migrator/datafixies/models/DatafixCandyModel";
import { DatafixUserItemModel } from "@/migrator/datafixies/models/DatafixUserItemModel";
import { DatafixThreadModel } from "@/migrator/datafixies/models/DatafixThreadModel";
import {
	type DatabaseConfigType,
	GetEnvDBConfig,
} from "@/src/entities/config/DatabaseConfig";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { Sequelize } from "sequelize-typescript";
import { SequelizeStorage, Umzug } from "umzug";
import type { MigrationParams } from "umzug/lib/types";

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

export const seeder = (dbConfig: DatabaseConfigType = GetEnvDBConfig()) => {
	const sequelize = new Sequelize(
		dbConfig.database,
		dbConfig.username,
		dbConfig.password,
		{
			host: dbConfig.host,
			port: dbConfig.port,
			dialect: "mysql",
			models: [DatafixUserItemModel, DatafixCandyModel, DatafixThreadModel],
		},
	);

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

export const datafixer = (dbConfig: DatabaseConfigType = GetEnvDBConfig()) => {
	const sequelize = new Sequelize(
		dbConfig.database,
		dbConfig.username,
		dbConfig.password,
		{
			host: dbConfig.host,
			port: dbConfig.port,
			dialect: "mysql",
			models: [DatafixUserItemModel, DatafixCandyModel, DatafixThreadModel],
		},
	);

	return new Umzug({
		migrations: {
			glob: "migrator/datafixies/*.ts",
		},
		context: sequelize,
		storage: new SequelizeStorage({
			sequelize,
			modelName: "umzug_datafixer_meta",
		}),
		logger: console,
	});
};

export type Migration = (
	params: MigrationParams<Sequelize>,
) => Promise<unknown>;
export type Seed = Migration;
export type Datafix = Migration;
