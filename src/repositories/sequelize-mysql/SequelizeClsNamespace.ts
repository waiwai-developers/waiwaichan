import { createNamespace, getNamespace } from "cls-hooked";

const NAMESPACE_NAME = "sequelize-mysql-transactions";

const sequelizeNamespace =
	getNamespace(NAMESPACE_NAME) ?? createNamespace(NAMESPACE_NAME);

export { NAMESPACE_NAME, sequelizeNamespace };
