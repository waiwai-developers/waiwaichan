interface ITransaction<T> {
	transaction<R>(cb: (t: T) => PromiseLike<R>): Promise<void>;
}
