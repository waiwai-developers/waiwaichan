import { RepoTypes, SchedulerRepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import { PinoSchedulerLogger } from "@/src/repositories/logger/PinoSchedulerLogger";
import { ReminderSchedulerRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlSchedulerConnector } from "@/src/repositories/sequelize-mysql/MysqlSchedulerConnector";
import { SequelizeTransaction } from "@/src/repositories/sequelize-mysql/SequelizeTransaction";
import { Container } from "inversify";
import type { Sequelize } from "sequelize-typescript";

const schedulerContainer = new Container(); // Logger
schedulerContainer.bind<ILogger>(RepoTypes.Logger).to(PinoSchedulerLogger);
schedulerContainer.bind<IDataBaseConnector<Sequelize, "mysql">>(RepoTypes.DatabaseConnector).to(MysqlSchedulerConnector).inSingletonScope();
schedulerContainer.bind<ITransaction>(RepoTypes.Transaction).to(SequelizeTransaction);
schedulerContainer.bind<IReminderSchedulerRepository>(SchedulerRepoTypes.ReminderSchedulerRepository).to(ReminderSchedulerRepositoryImpl);

export { schedulerContainer };
