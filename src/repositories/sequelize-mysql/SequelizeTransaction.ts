import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { sequelizeNamespace } from "@/src/repositories/sequelize-mysql/SequelizeClsNamespace";
import { inject, injectable } from "inversify";
import { Sequelize } from "sequelize";

@injectable()
export class SequelizeTransaction implements ITransaction {
	@inject(RepoTypes.DatabaseConnector)
	declare mysql: IDataBaseConnector<Sequelize, "mysql">;
	constructor() {
		Sequelize.useCLS(sequelizeNamespace);
	}
	async startTransaction<R>(cb: () => PromiseLike<R>): Promise<R> {
		return this.mysql.getDBInstance().transaction(cb);
	}
}
