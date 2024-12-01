export interface IMutex {
	useMutex<R>(key: string, cb: () => Promise<R>): Promise<R>;
}
