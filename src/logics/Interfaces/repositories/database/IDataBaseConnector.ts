export interface IDataBaseConnector<T, U> {
	getDBInstance(): T;
}
