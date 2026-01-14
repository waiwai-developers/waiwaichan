import { DatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import { CandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyItemRepositoryImpl";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyRepositoryImpl";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderRepositoryImpl";
import { RoomAddChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomAddChannelRepositoryImpl";
import { RoomChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomChannelRepositoryImpl";
import { RoomNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomNotificationChannelRepositoryImpl";
import { SequelizeLogger } from "@/src/repositories/sequelize-mysql/SequelizeLogger";
import { StickyRepositoryImpl } from "@/src/repositories/sequelize-mysql/StickyRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserCandyItemRepositoryImpl";
import type { Dialect } from "sequelize";
import { Sequelize } from "sequelize-typescript";

export class MysqlConnector implements IDataBaseConnector<Sequelize, "mysql"> {
	instance: Sequelize;

	constructor() {
		const dbConfig = DatabaseConfig;
		this.instance = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
			host: dbConfig.host,
			port: dbConfig.port,
			dialect: dbConfig.dialect as Dialect,
			logging: (s, t) => SequelizeLogger(s, t), // Pass undefined logger for tests
			models: [
				CandyRepositoryImpl,
				CandyItemRepositoryImpl,
				UserCandyItemRepositoryImpl,
				ReminderRepositoryImpl,
				ThreadRepositoryImpl,
				StickyRepositoryImpl,
				RoomAddChannelRepositoryImpl,
				RoomChannelRepositoryImpl,
				RoomNotificationChannelRepositoryImpl,
			],
		});
	}

	getDBInstance(): Sequelize {
		return this.instance;
	}
}
