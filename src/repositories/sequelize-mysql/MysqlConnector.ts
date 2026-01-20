import { DatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { CandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyItemRepositoryImpl";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyRepositoryImpl";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { CrownRepositoryImpl } from "@/src/repositories/sequelize-mysql/CrownRepositoryImpl";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderRepositoryImpl";
import { RoomAddChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomAddChannelRepositoryImpl";
import { RoomChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomChannelRepositoryImpl";
import { RoomNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomNotificationChannelRepositoryImpl";
import { SequelizeLogger } from "@/src/repositories/sequelize-mysql/SequelizeLogger";
import { StickyRepositoryImpl } from "@/src/repositories/sequelize-mysql/StickyRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserCandyItemRepositoryImpl";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
import { inject, injectable } from "inversify";
import type { Dialect } from "sequelize";
import { Sequelize } from "sequelize-typescript";

@injectable()
export class MysqlConnector implements IDataBaseConnector<Sequelize, "mysql"> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	static readonly models = [
		CandyRepositoryImpl,
		CandyItemRepositoryImpl,
		CrownRepositoryImpl,
		UserCandyItemRepositoryImpl,
		ReminderRepositoryImpl,
		ThreadRepositoryImpl,
		StickyRepositoryImpl,
		CommunityRepositoryImpl,
		UserRepositoryImpl,
		PersonalityRepositoryImpl,
		PersonalityContextRepositoryImpl,
		ContextRepositoryImpl,
		RoomAddChannelRepositoryImpl,
		RoomChannelRepositoryImpl,
		RoomNotificationChannelRepositoryImpl,
	];
	readonly instance: Sequelize;

	constructor() {
		const dbConfig = DatabaseConfig;
		this.instance = new Sequelize(
			dbConfig.database,
			dbConfig.username,
			dbConfig.password,
			{
				host: dbConfig.host,
				port: dbConfig.port,
				dialect: dbConfig.dialect as Dialect,
				logging: (s, t) => SequelizeLogger(s, t, this.logger),
				models: MysqlConnector.models,
			},
		);
	}
	getDBInstance(): Sequelize {
		return this.instance;
	}
}
