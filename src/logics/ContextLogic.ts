import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { ContextDto } from "@/src/entities/dto/ContextDto";
import type { ContextId } from "@/src/entities/vo/ContextId";

import type { IContextLogic } from "@/src/logics/Interfaces/logics/IContextLogic";
import type { IContextRepository } from "@/src/logics/Interfaces/repositories/database/IContextRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";

import { inject, injectable } from "inversify";

@injectable()
export class ContextLogic implements IContextLogic {
	@inject(RepoTypes.ContextRepository)
	private readonly contextRepository!: IContextRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	find(id: ContextId): Promise<ContextDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.contextRepository.findById(id);
		});
	}
}
