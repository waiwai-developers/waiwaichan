import { GetEnvDBConfig } from "@/src/entities/config/DatabaseConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { CandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyItemRepositoryImpl";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyRepositoryImpl";
import { CrownRepositoryImpl } from "@/src/repositories/sequelize-mysql/CrownRepositoryImpl";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderRepositoryImpl";
import { SequelizeLogger } from "@/src/repositories/sequelize-mysql/SequelizeLogger";
import { StickyRepositoryImpl } from "@/src/repositories/sequelize-mysql/StickyRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserCandyItemRepositoryImpl";
import { inject, injectable } from "inversify";
import type { Dialect } from "sequelize";
import { Sequelize } from "sequelize-typescript";

@injectable()
export class MysqlConnector implements IDataBaseConnector<Sequelize, "mysql"> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	instance: Sequelize;
	constructor() {
		const dbConfig = GetEnvDBConfig();
		this.instance = new Sequelize(
			dbConfig.database,
			dbConfig.username,
			dbConfig.password,
			{
				host: dbConfig.host,
				port: dbConfig.port,
				dialect: dbConfig.dialect as Dialect,
				logging: (s, t) => SequelizeLogger(s, t, this.logger),
				models: [
					CandyRepositoryImpl,
					CandyItemRepositoryImpl,
					CrownRepositoryImpl,
					UserCandyItemRepositoryImpl,
					ReminderRepositoryImpl,
					ThreadRepositoryImpl,
					StickyRepositoryImpl,
				],
			},
		);
	}
	getDBInstance(): Sequelize {
		return this.instance;
	}
}
