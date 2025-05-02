export interface ITransaction {
	startTransaction<R>(cb: () => PromiseLike<R>): Promise<R>;
}
