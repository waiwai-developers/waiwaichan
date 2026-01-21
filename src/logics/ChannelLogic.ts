import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { DeletedChannelTargetDto } from "@/src/entities/dto/DeletedChannelTargetDto";
import type { ChannelDto } from "@/src/entities/dto/ChannelDto";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IChannelRepository } from "@/src/logics/Interfaces/repositories/database/IChannelRepository";
import { inject, injectable } from "inversify";

import type { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import type { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import type { ChannelId } from "@/src/entities/vo/ChannelId";

@injectable()
export class ChannelLogic implements IChannelLogic {
	@inject(RepoTypes.ChannelRepository)
	private readonly ChannelRepository!: IChannelRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async bulkCreate(data: ChannelDto[]): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.ChannelRepository.bulkCreate(data);
		});
	}

	async deletebyCommunityId(communityId: ChannelCommunityId): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.ChannelRepository.deletebyCommunityId(communityId);
		});
	}

	async deleteByCommunityIdAndClientId(
		communityId: ChannelCommunityId,
		clientId: ChannelClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.ChannelRepository.deleteByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async deletebyClientId(
		communityId: ChannelCommunityId,
		clientId: ChannelClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.ChannelRepository.deleteByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async deleteNotBelongByCommunityIdAndClientIds(
		communityId: ChannelCommunityId,
		clientIds: ChannelClientId[],
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.ChannelRepository.deleteNotBelongByCommunityIdAndClientIds(
				communityId,
				clientIds,
			);
		});
	}

	async getId(data: ChannelDto): Promise<ChannelId | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.ChannelRepository.getId(data);
		});
	}

	async findByBatchStatusAndDeletedAt(): Promise<ChannelId[]> {
		return this.transaction.startTransaction(async () => {
			return await this.ChannelRepository.findByBatchStatusAndDeletedAt();
		});
	}

	async findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedChannelTargetDto[]
	> {
		return this.transaction.startTransaction(async () => {
			return await this.ChannelRepository.findDeletionTargetsByBatchStatusAndDeletedAt();
		});
	}

	async updatebatchStatus(id: ChannelId): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.ChannelRepository.updatebatchStatus(id);
		});
	}
}
