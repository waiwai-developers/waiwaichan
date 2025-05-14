import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { UserDto } from "@/src/entities/dto/UserDto";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
import { inject, injectable } from "inversify";

import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { UserId } from "@/src/entities/vo/UserId";

@injectable()
export class UserLogic implements IUserLogic {
	@inject(RepoTypes.UserRepository)
	private readonly UserRepository!: IUserRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async bulkCreate(data: UserDto[]): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.UserRepository.bulkCreate(data);
		});
	}

	async deletebyCommunityId(communityId: UserCommunityId): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.UserRepository.deletebyCommunityId(communityId);
		});
	}

	async deleteByCommunityIdAndClientId(
		communityId: UserCommunityId,
		clientId: UserClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.UserRepository.deleteByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async deletebyClientId(
		communityId: UserCommunityId,
		clientId: UserClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.UserRepository.deleteByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async deleteNotBelongByCommunityIdAndClientIds(
		communityId: UserCommunityId,
		clientIds: UserClientId[],
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.UserRepository.deleteNotBelongByCommunityIdAndClientIds(
				communityId,
				clientIds,
			);
		});
	}

	async getId(data: UserDto): Promise<UserId | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.UserRepository.getId(data);
		});
	}

	async findByBatchStatusAndDeletedAt(): Promise<UserId[]> {
		return this.transaction.startTransaction(async () => {
			return await this.UserRepository.findByBatchStatusAndDeletedAt();
		});
	}
}
