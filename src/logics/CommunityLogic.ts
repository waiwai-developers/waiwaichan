import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { CommunityDto } from "@/src/entities/dto/CommunityDto";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class CommunityLogic implements ICommunityLogic {
	@inject(RepoTypes.CommunityRepository)
	private readonly CommunityRepository!: ICommunityRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: CommunityDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.CommunityRepository.create(data);
		});
	}
	async delete(data: CommunityDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.CommunityRepository.delete(data);
		});
	}
}
