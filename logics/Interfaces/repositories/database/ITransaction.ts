interface TransactionLike {
	rollback(): Promise<void>;
	commit(): Promise<void>;
}
interface ITransaction<T extends TransactionLike> {
	startTransaction<R>(cb: (t: T) => PromiseLike<R>): Promise<R>;
}
