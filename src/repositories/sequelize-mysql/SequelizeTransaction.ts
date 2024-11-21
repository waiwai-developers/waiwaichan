import { MysqlConnector } from "@/src/repositories/sequelize-mysql/mysqlConnector";
import { createNamespace } from "cls-hooked";
import { injectable } from "inversify";
import { Sequelize, type Transaction } from "sequelize";

const namespace = createNamespace("transaction");
Sequelize.useCLS(namespace);
const mysql = MysqlConnector.getInstance();

@injectable()
export class SequelizeTransaction implements ITransaction<Transaction> {
	async startTransaction<R>(
		cb: (t: Transaction) => PromiseLike<R>,
	): Promise<R> {
		return mysql.transaction(cb);
	}
}
