import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatafixCandyModel } from "@/migrator/datafixies/models/DatafixCandyModel";
import { DatafixContextModel } from "@/migrator/datafixies/models/DatafixContextModel";
import { DatafixPersonalityContextModel } from "@/migrator/datafixies/models/DatafixPersonalityContextModel";
import { DatafixPersonalityModel } from "@/migrator/datafixies/models/DatafixPersonalityModel";
import { DatafixReminderModel } from "@/migrator/datafixies/models/DatafixReminderModel";
import { DatafixThreadModel } from "@/migrator/datafixies/models/DatafixThreadModel";
import { DatafixUserItemModel } from "@/migrator/datafixies/models/DatafixUserItemModel";
import {
	type DatabaseConfigType,
	GetEnvDatabaseConfig,
} from "@/src/entities/config/DatabaseConfig";
import { Sequelize } from "sequelize-typescript";
import { SequelizeStorage, Umzug } from "umzug";
import type { MigrationParams } from "umzug/lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const migrator = (
	dbConfig: DatabaseConfigType = GetEnvDatabaseConfig(),
) => {
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
			glob: path.join(__dirname, "migrations/*.{js,ts}"),

			resolve: ({ name, path: filepath, context }) => {
				// 拡張子を除いたベース名
				const baseName = name.replace(/\.(js|ts)$/, "");

				// ★ meta には必ず .ts で保存
				const storedName = `${baseName}.ts`;

				if (!filepath) {
					throw new Error(`Migration file path is undefined for: ${name}`);
				}

				return {
					name: storedName,

					up: async () => {
						const migration = await import(filepath);
						return migration.up(context);
					},

					down: async () => {
						const migration = await import(filepath);
						return migration.down?.(context);
					},
				};
			},
		},

		context: sequelize.getQueryInterface(),

		storage: new SequelizeStorage({
			sequelize,
			modelName: "umzug_migrator_meta",
		}),

		logger: console,
	});
};

export const seeder = (
	dbConfig: DatabaseConfigType = GetEnvDatabaseConfig(),
) => {
	const sequelize = new Sequelize(
		dbConfig.database,
		dbConfig.username,
		dbConfig.password,
		{
			host: dbConfig.host,
			port: dbConfig.port,
			dialect: "mysql",
			models: [
				DatafixUserItemModel,
				DatafixCandyModel,
				DatafixThreadModel,
				DatafixReminderModel,
			],
		},
	);

	return new Umzug({
		migrations: {
			glob: path.join(__dirname, "seeds/*.{js,ts}"),

			resolve: ({ name, path: filepath, context }) => {
				// 拡張子を除いたベース名
				const baseName = name.replace(/\.(js|ts)$/, "");

				// ★ meta には必ず .ts で保存
				const storedName = `${baseName}.ts`;

				if (!filepath) {
					throw new Error(`Migration file path is undefined for: ${name}`);
				}

				return {
					name: storedName,

					up: async () => {
						const migration = await import(filepath);
						return migration.up(context);
					},

					down: async () => {
						const migration = await import(filepath);
						return migration.down?.(context);
					},
				};
			},
		},

		context: sequelize.getQueryInterface(),

		storage: new SequelizeStorage({
			sequelize,
			modelName: "umzug_seeder_meta",
		}),

		logger: console,
	});
};

export const datafixer = (
	dbConfig: DatabaseConfigType = GetEnvDatabaseConfig(),
) => {
	const sequelize = new Sequelize(
		dbConfig.database,
		dbConfig.username,
		dbConfig.password,
		{
			host: dbConfig.host,
			port: dbConfig.port,
			dialect: "mysql",
			models: [
				DatafixUserItemModel,
				DatafixCandyModel,
				DatafixThreadModel,
				DatafixReminderModel,
				DatafixPersonalityModel,
				DatafixContextModel,
				DatafixPersonalityContextModel,
			],
		},
	);

	return new Umzug({
		migrations: {
			glob: path.join(__dirname, "datafixies/*.{js,ts}"),

			resolve: ({ name, path: filepath, context }) => {
				// 拡張子を除いたベース名
				const baseName = name.replace(/\.(js|ts)$/, "");

				// ★ meta には必ず .ts で保存
				const storedName = `${baseName}.ts`;

				if (!filepath) {
					throw new Error(`Migration file path is undefined for: ${name}`);
				}

				return {
					name: storedName,

					up: async () => {
						const migration = await import(filepath);
						return migration.up(context);
					},

					down: async () => {
						const migration = await import(filepath);
						return migration.down?.(context);
					},
				};
			},
		},

		context: sequelize.getQueryInterface(),

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
