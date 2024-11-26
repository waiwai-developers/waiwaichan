import * as process from "node:process";
import { DatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import { PointItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/PointItemRepositoryImpl";
import { PointRepositoryImpl } from "@/src/repositories/sequelize-mysql/PointRepositoryImpl";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderRepositoryImpl";
import { ReminderSchedulerRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderSchedulerRepositoryImpl";
import { UserPointItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserPointItemRepositoryImpl";
import { injectable } from "inversify";
import type { Dialect } from "sequelize";
import { Sequelize } from "sequelize-typescript";

@injectable()
export class MysqlSchedulerConnector
	implements IDataBaseConnector<Sequelize, "mysql">
{
	instance: Sequelize;
	constructor() {
		const dbConfig = this.getDbConfig();
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
	private getDbConfig() {
		switch (process.env.NODE_ENV || "development") {
			case "test":
				return DatabaseConfig.test;
			case "production":
				return DatabaseConfig.production;
			default:
				return DatabaseConfig.development;
		}
	}
	getDBInstance(): Sequelize {
		return this.instance;
	}
}
