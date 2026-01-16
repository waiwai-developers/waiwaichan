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

import { QueryTypes } from "sequelize";

const normalizeUmzugMeta = async (sequelize: Sequelize, tableName: string) => {
	// テーブルが存在するかチェック
	const [tableExists] = await sequelize.query<{ count: number }>(
		`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLES 
		 WHERE TABLE_SCHEMA = :database AND TABLE_NAME = :tableName`,
		{
			type: QueryTypes.SELECT,
			replacements: {
				database: sequelize.getDatabaseName(),
				tableName: tableName,
			},
		},
	);

	if (!tableExists || tableExists.count === 0) {
		// テーブルが存在しない場合は何もしない（初回マイグレーション時）
		return;
	}

	// name に .js / .ts が付いているものを取得
	const rows = await sequelize.query<{ name: string }>(
		`SELECT name FROM ${tableName} WHERE name REGEXP '\\\\.(js|ts)$'`,
		{ type: QueryTypes.SELECT },
	);

	if (rows.length === 0) {
		return;
	}

	await sequelize.transaction(async (tx) => {
		for (const { name } of rows) {
			const normalized = name.replace(/\.(js|ts)$/, "");

			//js migration をすべて削除
			await sequelize.query(
				`DELETE FROM ${tableName} WHERE name REGEXP '\\\\.js$'`,
				{ transaction: tx },
			);

			// すでに正規名が存在するか？
			const exists = await sequelize.query(
				`SELECT 1 FROM ${tableName} WHERE name = :normalized LIMIT 1`,
				{
					type: QueryTypes.SELECT,
					replacements: { normalized },
					transaction: tx,
				},
			);

			if (exists.length === 0) {
				// name を更新
				await sequelize.query(
					`UPDATE ${tableName} SET name = :normalized WHERE name = :original`,
					{
						replacements: {
							normalized,
							original: name,
						},
						transaction: tx,
					},
				);
			} else {
				// すでにあるなら古い方を削除
				await sequelize.query(
					`DELETE FROM ${tableName} WHERE name = :original`,
					{
						replacements: { original: name },
						transaction: tx,
					},
				);
			}
		}
	});
};

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

	// ここで過去データを正規化
	void normalizeUmzugMeta(sequelize, "umzug_migrator_meta");

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

	// ここで過去データを正規化
	void normalizeUmzugMeta(sequelize, "umzug_seeder_meta");

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
				DatafixPersonalityModel,
				DatafixContextModel,
				DatafixPersonalityContextModel,
			],
		},
	);

	// ここで過去データを正規化
	void normalizeUmzugMeta(sequelize, "umzug_datafixer_meta");

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
