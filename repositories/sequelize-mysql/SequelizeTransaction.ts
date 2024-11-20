import { MysqlConnector } from "@/repositories/sequelize-mysql/mysqlConnector";
import { createNamespace } from "cls-hooked";
import { Sequelize, type Transaction } from "sequelize";

const namespace = createNamespace("transaction");
Sequelize.useCLS(namespace);
const mysql = MysqlConnector.getInstance();

export class SequelizeTransaction implements ITransaction<Transaction> {
	async startTransaction<R>(
		cb: (t: Transaction) => PromiseLike<R>,
	): Promise<R> {
		return mysql.transaction(cb);
	}
}
