import { DatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { CandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyItemRepositoryImpl";
import { CandyNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyNotificationChannelRepositoryImpl";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyRepositoryImpl";
import { ChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/ChannelRepositoryImpl";
import { CommandImpl } from "@/src/repositories/sequelize-mysql/CommandImpl";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { CrownNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/CrownNotificationChannelRepositoryImpl";
import { CrownRepositoryImpl } from "@/src/repositories/sequelize-mysql/CrownRepositoryImpl";
import { CustomRoleCommandImpl } from "@/src/repositories/sequelize-mysql/CustomRoleCommandImpl";
import { CustomRoleImpl } from "@/src/repositories/sequelize-mysql/CustomRoleImpl";
import { MessageRepositoryImpl } from "@/src/repositories/sequelize-mysql/MessageRepositoryImpl";
import { PredefinedRoleCommandImpl } from "@/src/repositories/sequelize-mysql/PredefinedRoleCommandImpl";
import { PredefinedRoleImpl } from "@/src/repositories/sequelize-mysql/PredefinedRoleImpl";
import { ReminderSchedulerRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderSchedulerRepositoryImpl";
import { RoleCustomRoleImpl } from "@/src/repositories/sequelize-mysql/RoleCustomRoleImpl";
import { RolePredefinedRoleImpl } from "@/src/repositories/sequelize-mysql/RolePredefinedRoleImpl";
import { RoleRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoleRepositoryImpl";
import { RoomAddChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomAddChannelRepositoryImpl";
import { RoomCategoryChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoomCategoryChannelRepositoryImpl";
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
export class MysqlSchedulerConnector
	implements IDataBaseConnector<Sequelize, "mysql">
{
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	static readonly models = [
		ReminderSchedulerRepositoryImpl,
		CommunityRepositoryImpl,
		UserRepositoryImpl,
		ChannelRepositoryImpl,
		CommandImpl,
		MessageRepositoryImpl,
		PredefinedRoleImpl,
		PredefinedRoleCommandImpl,
		CustomRoleImpl,
		CustomRoleCommandImpl,
		RoleRepositoryImpl,
		RoleCustomRoleImpl,
		RolePredefinedRoleImpl,
		// userId関連データ削除用
		CandyRepositoryImpl,
		CandyNotificationChannelRepositoryImpl,
		CrownNotificationChannelRepositoryImpl,
		CrownRepositoryImpl,
		CandyItemRepositoryImpl,
		UserCandyItemRepositoryImpl,
		// channelId関連データ削除用
		ThreadRepositoryImpl,
		StickyRepositoryImpl,
		RoomAddChannelRepositoryImpl,
		RoomChannelRepositoryImpl,
		RoomNotificationChannelRepositoryImpl,
		RoomCategoryChannelRepositoryImpl,
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
				models: MysqlSchedulerConnector.models,
			},
		);
	}
	getDBInstance(): Sequelize {
		return this.instance;
	}
}
