import { GetEnvDBConfig } from "@/src/entities/config/DatabaseConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { ReminderSchedulerRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderSchedulerRepositoryImpl";
import { SequelizeLogger } from "@/src/repositories/sequelize-mysql/SequelizeLogger";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
import { inject, injectable } from "inversify";
import type { Dialect } from "sequelize";
import { Sequelize } from "sequelize-typescript";
@injectable()
export class MysqlSchedulerConnector
	implements IDataBaseConnector<Sequelize, "mysql">
{
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	static readonly models = [
		ReminderSchedulerRepositoryImpl,
		CommunityRepositoryImpl,
		UserRepositoryImpl,
	];
	readonly instance: Sequelize;

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
				models: MysqlSchedulerConnector.models,
			},
		);
	}
	getDBInstance(): Sequelize {
		return this.instance;
	}
}
