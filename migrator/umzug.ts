import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatafixCandyModel } from "@/migrator/datafixies/models/DatafixCandyModel";
import { DatafixUserItemModel } from "@/migrator/datafixies/models/DatafixUserItemModel";
import { DatafixThreadModel } from "@/migrator/datafixies/models/DatafixThreadModel";
import { DatafixPersonalityModel } from "@/migrator/datafixies/models/DatafixPersonalityModel";
import { DatafixPersonalityContextModel } from "@/migrator/datafixies/models/DatafixPersonalityContextModel";
import { DatafixContextModel } from "@/migrator/datafixies/models/DatafixContextModel";
import { DatafixReminderModel } from "@/migrator/datafixies/models/DatafixReminderModel";
import {
	type DatabaseConfigType,
	GetEnvDatabaseConfig,
} from "@/src/entities/config/DatabaseConfig";
import { Sequelize } from "sequelize-typescript";
import { SequelizeStorage, Umzug } from "umzug";
import type { MigrationParams } from "umzug/lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrator = (dbConfig: DatabaseConfigType = GetEnvDatabaseConfig() ) => {
	const sequelize = new Sequelize(
		dbConfig.database,
		dbConfig.username,
		dbConfig.password,
		{
			host: dbConfig.host,
			port: dbConfig.port,
			dialect: "mysql",
		},
	);
	return new Umzug({
		migrations: {
			glob: path.join(__dirname, "migrations/*.js"),
		},
		context: sequelize,
		storage: new SequelizeStorage({
			sequelize,
			modelName: "umzug_migrator_meta",
		}),
		logger: console,
	});
};

export const seeder = (dbConfig: DatabaseConfigType = GetEnvDatabaseConfig()) => {
	const sequelize = new Sequelize(
		dbConfig.database,
		dbConfig.username,
		dbConfig.password,
		{
			host: dbConfig.host,
			port: dbConfig.port,
			dialect: "mysql",
			models: [DatafixUserItemModel, DatafixCandyModel, DatafixThreadModel, DatafixReminderModel],
		},
	);

	return new Umzug({
		migrations: {
			glob: path.join(__dirname, "seeds/*.js"),
		},
		context: sequelize,
		storage: new SequelizeStorage({
			sequelize,
			modelName: "umzug_seeder_meta",
		}),
		logger: console,
	});
};

export const datafixer = (dbConfig: DatabaseConfigType = GetEnvDatabaseConfig()) => {
	const sequelize = new Sequelize(
		dbConfig.database,
		dbConfig.username,
		dbConfig.password,
		{
			host: dbConfig.host,
			port: dbConfig.port,
			dialect: "mysql",
			models: [DatafixUserItemModel, DatafixCandyModel, DatafixThreadModel, DatafixReminderModel, DatafixPersonalityModel, DatafixContextModel ,DatafixPersonalityContextModel],
		},
	);

	return new Umzug({
		migrations: {
			glob: path.join(__dirname, "datafixies/*.js"),
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
