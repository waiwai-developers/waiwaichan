import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatafixCandyModel } from "@/migrator/datafixies/models/DatafixCandyModel";
import { DatafixChannelModel } from "@/migrator/datafixies/models/DatafixChannelModel";
import { DatafixCommunityModel } from "@/migrator/datafixies/models/DatafixCommunityModel";
import { DatafixContextModel } from "@/migrator/datafixies/models/DatafixContextModel";
import { DatafixCrownModel } from "@/migrator/datafixies/models/DatafixCrownModel";
import { DatafixPersonalityContextModel } from "@/migrator/datafixies/models/DatafixPersonalityContextModel";
import { DatafixPersonalityModel } from "@/migrator/datafixies/models/DatafixPersonalityModel";
import { DatafixReminderModel } from "@/migrator/datafixies/models/DatafixReminderModel";
import { DatafixRoomAddChannelsModel } from "@/migrator/datafixies/models/DatafixRoomAddChannelsModel";
import { DatafixRoomChannelsModel } from "@/migrator/datafixies/models/DatafixRoomChannelsModel";
import { DatafixRoomNotificationChannelsModel } from "@/migrator/datafixies/models/DatafixRoomNotificationChannelsModel";
import { DatafixThreadModel } from "@/migrator/datafixies/models/DatafixThreadModel";
import { DatafixUserItemModel } from "@/migrator/datafixies/models/DatafixUserItemModel";
import { DatafixUserModel } from "@/migrator/datafixies/models/DatafixUserModel";
import {
	type DatabaseConfigType,
	GetEnvDatabaseConfig,
} from "@/src/entities/config/DatabaseConfig";
import { Sequelize } from "sequelize-typescript";
import { SequelizeStorage, Umzug } from "umzug";
import type { MigrationParams } from "umzug/lib/types";
import { DatafixRoleModel } from "./datafixies/models/DatafixRoleModel";
import { DatafixRolesPredefinedRolesModel } from "./datafixies/models/DatafixRolesPredefinedRolesModel";
import { DatafixStickyModel } from "./datafixies/models/DatafixStickyModel";

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
			glob: path.join(__dirname, "migrations/*"),

			resolve: ({ name, path: filepath }) => {
				const baseName = name.replace(/\.(js|ts)$/, "");

				if (!filepath) {
					throw new Error(`Migration file path is undefined for: ${name}`);
				}

				return {
					name: baseName,
					up: async ({ context }) => {
						const migration = await import(filepath);
						return migration.up({ context });
					},
					down: async ({ context }) => {
						const migration = await import(filepath);
						return migration.down?.({ context });
					},
				};
			},
		},
		context: sequelize,
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
			glob: path.join(__dirname, "seeds/*"),

			resolve: ({ name, path: filepath, context }) => {
				// 拡張子を除いたベース名
				const baseName = name.replace(/\.(js|ts)$/, "");

				if (!filepath) {
					throw new Error(`Migration file path is undefined for: ${name}`);
				}

				return {
					name: baseName,

					up: async () => {
						const migration = await import(filepath);
						return migration.up({ context });
					},

					down: async () => {
						const migration = await import(filepath);
						return migration.down({ context });
					},
				};
			},
		},

		context: sequelize,

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
				DatafixCommunityModel,
				DatafixUserModel,
				DatafixStickyModel,
				DatafixCrownModel,
				DatafixPersonalityModel,
				DatafixContextModel,
				DatafixPersonalityContextModel,
				DatafixRoomAddChannelsModel,
				DatafixRoomChannelsModel,
				DatafixRoomNotificationChannelsModel,
				DatafixChannelModel,
				DatafixRoleModel,
				DatafixRolesPredefinedRolesModel,
			],
		},
	);

	return new Umzug({
		migrations: {
			glob: path.join(__dirname, "datafixies/*"),

			resolve: ({ name, path: filepath, context }) => {
				// 拡張子を除いたベース名
				const baseName = name.replace(/\.(js|ts)$/, "");

				if (!filepath) {
					throw new Error(`Migration file path is undefined for: ${name}`);
				}

				return {
					name: baseName,

					up: async () => {
						const migration = await import(filepath);
						return migration.up({ context });
					},

					down: async () => {
						const migration = await import(filepath);
						return migration.down({ context });
					},
				};
			},
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
