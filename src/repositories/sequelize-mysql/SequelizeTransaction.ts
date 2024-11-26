import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import { inject, injectable } from "inversify";
import type { Sequelize, Transaction } from "sequelize";

@injectable()
export class SequelizeTransaction implements ITransaction<Transaction> {
	@inject(RepoTypes.DatabaseConnector)
	declare mysql: IDataBaseConnector<Sequelize, "mysql">;
	async startTransaction<R>(
		cb: (t: Transaction) => PromiseLike<R>,
	): Promise<R> {
		return this.mysql.getDBInstance().transaction(cb);
	}
}
