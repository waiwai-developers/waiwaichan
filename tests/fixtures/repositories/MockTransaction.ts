import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";

export class MockTransaction implements ITransaction {
    async startTransaction<R>(cb: () => PromiseLike<R>): Promise<R> {
        return await cb();
    }
}
