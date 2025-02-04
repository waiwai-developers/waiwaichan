import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import { createNamespace } from "cls-hooked";
import { inject, injectable } from "inversify";
import { Sequelize, type Transaction } from "sequelize";

@injectable()
export class SequelizeTransaction implements ITransaction {
	@inject(RepoTypes.DatabaseConnector)
	declare mysql: IDataBaseConnector<Sequelize, "mysql">;
	constructor() {
		const namespace = createNamespace("sequelize-mysql-transactions");
		Sequelize.useCLS(namespace);
	}
	async startTransaction<R>(cb: () => PromiseLike<R>): Promise<R> {
		return this.mysql.getDBInstance().transaction(cb);
	}
}
