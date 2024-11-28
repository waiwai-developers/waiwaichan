import { GetEnvDBConfig } from "@/src/entities/config/DatabaseConfig";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import { PointItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/PointItemRepositoryImpl";
import { PointRepositoryImpl } from "@/src/repositories/sequelize-mysql/PointRepositoryImpl";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderRepositoryImpl";
import { UserPointItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserPointItemRepositoryImpl";
import { injectable } from "inversify";
import type { Dialect } from "sequelize";
import { Sequelize } from "sequelize-typescript";

@injectable()
export class MysqlConnector implements IDataBaseConnector<Sequelize, "mysql"> {
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
				models: [
					PointRepositoryImpl,
					PointItemRepositoryImpl,
					UserPointItemRepositoryImpl,
					ReminderRepositoryImpl,
				],
			},
		);
	}
	getDBInstance(): Sequelize {
		return this.instance;
	}
}
