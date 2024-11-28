import type { IMutex } from "@/src/logics/Interfaces/repositories/mutex/IMutex";
import { Mutex } from "await-semaphore";
const mutexMap = new Map();

export class AwaitSemaphoreMutex implements IMutex<Mutex> {
	getMutex(key: string) {
		if (!mutexMap.has(key)) {
			mutexMap.set(key, new Mutex());
		}
		return mutexMap.get(key);
	}

	async useMutex<T>(mutex: Mutex, cb: () => Promise<T>): Promise<T> {
		return await mutex.use(cb);
	}
}
