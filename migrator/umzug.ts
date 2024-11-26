import { MysqlConnector } from "@/src/repositories/sequelize-mysql/mysqlConnector";
import type { Sequelize } from "sequelize";
import { SequelizeStorage, SequelizeType, Umzug } from "umzug";

const s = MysqlConnector.getInstance();

export const migrator = (sequelize: Sequelize = s) => {
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
const migrationInterface = migrator()._types.migration;
export type Migration = typeof migrationInterface;

export const seeder = (sequelize: Sequelize = s) => {
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

const seedInterface = seeder()._types.migration;
export type Seed = typeof seedInterface;
