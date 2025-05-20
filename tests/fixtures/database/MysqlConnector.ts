import { GetEnvDBConfig } from "@/src/entities/config/DatabaseConfig";
import { Sequelize } from "sequelize-typescript";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyRepositoryImpl";
import { CandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyItemRepositoryImpl";
import { UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserCandyItemRepositoryImpl";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql/ReminderRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import type { Dialect } from "sequelize";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";

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
                models: [
                    CandyRepositoryImpl,
                    CandyItemRepositoryImpl,
                    UserCandyItemRepositoryImpl,
                    ReminderRepositoryImpl,
                    ThreadRepositoryImpl,
                ],
            },
        );
    }

    getDBInstance(): Sequelize {
        return this.instance;
    }
}
