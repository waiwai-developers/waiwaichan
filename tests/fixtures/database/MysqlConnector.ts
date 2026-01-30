import { DatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import { CandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyItemRepositoryImpl";
import { CandyNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyNotificationChannelRepositoryImpl";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyRepositoryImpl";
import { ChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/ChannelRepositoryImpl";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { CrownNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/CrownNotificationChannelRepositoryImpl";
import { CrownRepositoryImpl } from "@/src/repositories/sequelize-mysql/CrownRepositoryImpl";
import { MessageRepositoryImpl } from "@/src/repositories/sequelize-mysql/MessageRepositoryImpl";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderRepositoryImpl";
import { RoomAddChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomAddChannelRepositoryImpl";
import { RoomCategoryChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomCategoryChannelRepositoryImpl";
import { RoomChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomChannelRepositoryImpl";
import { RoomNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomNotificationChannelRepositoryImpl";
import { SequelizeLogger } from "@/src/repositories/sequelize-mysql/SequelizeLogger";
import { StickyRepositoryImpl } from "@/src/repositories/sequelize-mysql/StickyRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserCandyItemRepositoryImpl";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
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
				CandyNotificationChannelRepositoryImpl,
				ChannelRepositoryImpl,
				CrownNotificationChannelRepositoryImpl,
				CrownRepositoryImpl,
				UserCandyItemRepositoryImpl,
				ReminderRepositoryImpl,
				ThreadRepositoryImpl,
				StickyRepositoryImpl,
				CommunityRepositoryImpl,
				UserRepositoryImpl,
				MessageRepositoryImpl,
				PersonalityRepositoryImpl,
				PersonalityContextRepositoryImpl,
				ContextRepositoryImpl,
				RoomAddChannelRepositoryImpl,
				RoomChannelRepositoryImpl,
				RoomNotificationChannelRepositoryImpl,
				RoomCategoryChannelRepositoryImpl,
			],
		});
	}

	getDBInstance(): Sequelize {
		return this.instance;
	}
}
