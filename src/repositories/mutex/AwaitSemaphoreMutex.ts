import type { IMutex } from "@/src/logics/Interfaces/repositories/mutex/IMutex";
import { Mutex } from "await-semaphore";
const mutexMap = new Map();

export class AwaitSemaphoreMutex implements IMutex {
	private getMutex(key: string) {
		if (!mutexMap.has(key)) {
			mutexMap.set(key, new Mutex());
		}
		return mutexMap.get(key);
	}

	async useMutex<T>(key: string, cb: () => Promise<T>): Promise<T> {
		return await this.getMutex(key).use(cb);
	}
}
