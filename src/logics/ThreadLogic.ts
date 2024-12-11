
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { ThreadDto } from "@/src/entities/dto/ThreadDto";
import type { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import type { IThreadRepository } from "@/src/logics/Interfaces/repositories/database/IThreadRepository";
import { inject, injectable } from "inversify";

@injectable()
export class ThreadLogic implements IThreadLogic {
	@inject(RepoTypes.ThreadRepository)
	private readonly threadRepository!: IThreadRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction<TransactionLike>;

	async create(data: ThreadDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return  await this.threadRepository.create(data);
		});
	}
	find(messageId: ThreadMessageId): Promise<ThreadDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.threadRepository.findByMessageId(messageId);
		});
	}
}
