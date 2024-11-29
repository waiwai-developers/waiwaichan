import { GetEnvDBConfig } from "@/src/entities/config/DatabaseConfig";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import { ReminderSchedulerRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderSchedulerRepositoryImpl";
import { injectable } from "inversify";
import type { Dialect } from "sequelize";
import { Sequelize } from "sequelize-typescript";

@injectable()
export class MysqlSchedulerConnector
	implements IDataBaseConnector<Sequelize, "mysql">
{
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
				logging: (sql, timing) => {
					//
					// @ts-ignore
					if (typeof timing === "object" && timing?.bind) {
						//@ts-ignore
						const bind = timing.bind;
						console.log(`${sql} params:{${bind}}`);
					} else {
						console.log(sql);
					}
				},
				models: [ReminderSchedulerRepositoryImpl],
			},
		);
	}
	getDBInstance(): Sequelize {
		return this.instance;
	}
}
