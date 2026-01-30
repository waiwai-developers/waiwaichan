import { LogicTypes, RepoTypes, SchedulerRepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChannelLogic } from "@/src/logics/ChannelLogic";
import { CommunityLogic } from "@/src/logics/CommunityLogic";
import { DataDeletionCircularLogic } from "@/src/logics/DataDeletionCircularLogic";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IDataDeletionCircularLogic } from "@/src/logics/Interfaces/logics/IDataDeletionCircularLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { IChannelRepository } from "@/src/logics/Interfaces/repositories/database/IChannelRepository";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { IMessageRepository } from "@/src/logics/Interfaces/repositories/database/IMessageRepository";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { MessageLogic } from "@/src/logics/MessageLogic";
import { UserLogic } from "@/src/logics/UserLogic";
import { PinoSchedulerLogger } from "@/src/repositories/logger/PinoSchedulerLogger";
import {
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
	DataDeletionCircularImpl,
	MessageRepositoryImpl,
	ReminderSchedulerRepositoryImpl,
	UserRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlSchedulerConnector } from "@/src/repositories/sequelize-mysql/MysqlSchedulerConnector";
import { SequelizeTransaction } from "@/src/repositories/sequelize-mysql/SequelizeTransaction";
import { Container } from "inversify";
import type { Sequelize } from "sequelize-typescript";

const schedulerContainer = new Container();

// Logger
schedulerContainer.bind<ILogger>(RepoTypes.Logger).to(PinoSchedulerLogger);

// Database
schedulerContainer.bind<IDataBaseConnector<Sequelize, "mysql">>(RepoTypes.DatabaseConnector).to(MysqlSchedulerConnector).inSingletonScope();
schedulerContainer.bind<ITransaction>(RepoTypes.Transaction).to(SequelizeTransaction);
schedulerContainer.bind<IReminderSchedulerRepository>(SchedulerRepoTypes.ReminderSchedulerRepository).to(ReminderSchedulerRepositoryImpl);
schedulerContainer.bind<ICommunityRepository>(RepoTypes.CommunityRepository).to(CommunityRepositoryImpl);
schedulerContainer.bind<IUserRepository>(RepoTypes.UserRepository).to(UserRepositoryImpl);
schedulerContainer.bind<IChannelRepository>(RepoTypes.ChannelRepository).to(ChannelRepositoryImpl);
schedulerContainer.bind<IMessageRepository>(RepoTypes.MessageRepository).to(MessageRepositoryImpl);
schedulerContainer.bind(RepoTypes.DataDeletionCircular).to(DataDeletionCircularImpl);

// Logics
schedulerContainer.bind<ICommunityLogic>(LogicTypes.CommunityLogic).to(CommunityLogic);
schedulerContainer.bind<IUserLogic>(LogicTypes.UserLogic).to(UserLogic);
schedulerContainer.bind<IChannelLogic>(LogicTypes.ChannelLogic).to(ChannelLogic);
schedulerContainer.bind<IMessageLogic>(LogicTypes.MessageLogic).to(MessageLogic);
schedulerContainer.bind<IDataDeletionCircularLogic>(LogicTypes.dataDeletionCircularLogic).to(DataDeletionCircularLogic);

export { schedulerContainer };
