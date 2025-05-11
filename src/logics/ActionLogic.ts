import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { ActionDto } from "@/src/entities/dto/ActionDto";
import type { IActionLogic } from "@/src/logics/Interfaces/logics/IActionLogic";
import type { IActionRepository } from "@/src/logics/Interfaces/repositories/database/IActionRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class ActionLogic implements IActionLogic {
	@inject(RepoTypes.ActionRepository)
	private readonly ActionRepository!: IActionRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: ActionDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.ActionRepository.create(data);
		});
	}
	async delete(data: ActionDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.ActionRepository.delete(data);
		});
	}
}
