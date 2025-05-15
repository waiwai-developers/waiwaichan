import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { CommunityDto } from "@/src/entities/dto/CommunityDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";
import type { CommunityCategoryType } from "../entities/vo/CommunityCategoryType";
import type { CommunityClientId } from "../entities/vo/CommunityClientId";

@injectable()
export class CommunityLogic implements ICommunityLogic {
	@inject(RepoTypes.CommunityRepository)
	private readonly CommunityRepository!: ICommunityRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: CommunityDto): Promise<CommunityId> {
		return this.transaction.startTransaction(async () => {
			return await this.CommunityRepository.create(data);
		});
	}

	async delete(data: CommunityDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.CommunityRepository.delete(data);
		});
	}

	async getId(data: CommunityDto): Promise<CommunityId | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.CommunityRepository.getId(data);
		});
	}

	async getNotExistClientId(
		categoryType: CommunityCategoryType,
		clientIds: CommunityClientId[],
	): Promise<CommunityClientId[]> {
		return this.transaction.startTransaction(async () => {
			return await this.CommunityRepository.getNotExistClientId(
				categoryType,
				clientIds,
			);
		});
	}

	async findByBatchStatusAndDeletedAt(): Promise<CommunityId[]> {
		return this.transaction.startTransaction(async () => {
			return await this.CommunityRepository.findByBatchStatusAndDeletedAt();
		});
	}

	async updatebatchStatus(id: CommunityId): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.CommunityRepository.updatebatchStatus(id);
		});
	}
}
