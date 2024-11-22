import { MysqlConnector } from "@/src/repositories/sequelize-mysql/mysqlConnector";
import { SequelizeStorage, Umzug } from "umzug";

const sequelize = MysqlConnector.getInstance();

export const migrator = new Umzug({
	migrations: {
		glob: "migrations/*.ts",
	},
	context: sequelize,
	storage: new SequelizeStorage({
		sequelize,
		modelName: "SequelizeMeta",
	}),
	logger: console,
});

export type Migration = typeof migrator._types.migration;

export const seeder = new Umzug({
	migrations: {
		glob: "seeds/*.ts",
	},
	context: sequelize,
	storage: new SequelizeStorage({
		sequelize,
		modelName: "migrator_meta",
	}),
	logger: console,
});

export type Seed = typeof seeder._types.migration;
