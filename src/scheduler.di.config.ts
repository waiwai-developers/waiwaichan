import { LogicTypes, RepoTypes, SchedulerRepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityLogic } from "@/src/logics/CommunityLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
import { UserLogic } from "@/src/logics/UserLogic";
import { PinoSchedulerLogger } from "@/src/repositories/logger/PinoSchedulerLogger";
import { CommunityRepositoryImpl, ReminderSchedulerRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { DataDeletionCircularImpl } from "@/src/repositories/sequelize-mysql/DataDeletionCircularImpl";
import { MysqlSchedulerConnector } from "@/src/repositories/sequelize-mysql/MysqlSchedulerConnector";
import { SequelizeTransaction } from "@/src/repositories/sequelize-mysql/SequelizeTransaction";
import { Container } from "inversify";
import type { Sequelize } from "sequelize-typescript";
import type { ITransaction } from "./logics/Interfaces/repositories/database/ITransaction";
import type { ILogger } from "./logics/Interfaces/repositories/logger/ILogger";

const schedulerContainer = new Container();

// Logger
schedulerContainer.bind<ILogger>(RepoTypes.Logger).to(PinoSchedulerLogger);

// Database
schedulerContainer.bind<IDataBaseConnector<Sequelize, "mysql">>(RepoTypes.DatabaseConnector).to(MysqlSchedulerConnector).inSingletonScope();
schedulerContainer.bind<ITransaction>(RepoTypes.Transaction).to(SequelizeTransaction);
schedulerContainer.bind<IReminderSchedulerRepository>(SchedulerRepoTypes.ReminderSchedulerRepository).to(ReminderSchedulerRepositoryImpl);
schedulerContainer.bind<IDataDeletionCircular>(RepoTypes.DataDeletionCircular).to(DataDeletionCircularImpl);
schedulerContainer.bind<ICommunityRepository>(RepoTypes.CommunityRepository).to(CommunityRepositoryImpl);
schedulerContainer.bind<IUserRepository>(RepoTypes.UserRepository).to(UserRepositoryImpl);

// Logics
schedulerContainer.bind<ICommunityLogic>(LogicTypes.CommunityLogic).to(CommunityLogic);
schedulerContainer.bind<IUserLogic>(LogicTypes.UserLogic).to(UserLogic);

export { schedulerContainer };
