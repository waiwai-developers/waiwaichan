export interface IMutex<T> {
	getMutex(key: string): T;
	useMutex<R>(mutex: T, cb: () => Promise<R>): Promise<R>;
}
