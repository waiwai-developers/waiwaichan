import { GetEnvDBConfig } from "@/src/entities/config/DatabaseConfig";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import { CandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyItemRepositoryImpl";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyRepositoryImpl";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderRepositoryImpl";
import { SequelizeLogger } from "@/src/repositories/sequelize-mysql/SequelizeLogger";
import { UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserCandyItemRepositoryImpl";
import { injectable } from "inversify";
import type { Dialect } from "sequelize";
import { Sequelize } from "sequelize-typescript";

@injectable()
export class MysqlConnector implements IDataBaseConnector<Sequelize, "mysql"> {
	instance: Sequelize;
	constructor() {
		const dbConfig = GetEnvDBConfig();
		console.log(dbConfig);
		this.instance = new Sequelize(
			dbConfig.database,
			dbConfig.username,
			dbConfig.password,

			{
				host: dbConfig.host,
				port: dbConfig.port,
				dialect: dbConfig.dialect as Dialect,
				logging: SequelizeLogger,
				models: [
					CandyRepositoryImpl,
					CandyItemRepositoryImpl,
					UserCandyItemRepositoryImpl,
					ReminderRepositoryImpl,
				],
			},
		);
	}
	getDBInstance(): Sequelize {
		return this.instance;
	}
}
