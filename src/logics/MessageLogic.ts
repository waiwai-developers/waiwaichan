import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { DeletedMessageTargetDto } from "@/src/entities/dto/DeletedMessageTargetDto";
import type { MessageDto } from "@/src/entities/dto/MessageDto";
import type { MessageChannelId } from "@/src/entities/vo/MessageChannelId";
import type { MessageClientId } from "@/src/entities/vo/MessageClientId";
import type { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import type { MessageId } from "@/src/entities/vo/MessageId";
import type { MessageUserId } from "@/src/entities/vo/MessageUserId";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IMessageRepository } from "@/src/logics/Interfaces/repositories/database/IMessageRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class MessageLogic implements IMessageLogic {
	@inject(RepoTypes.MessageRepository)
	private readonly MessageRepository!: IMessageRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async bulkCreate(data: MessageDto[]): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.bulkCreate(data);
		});
	}

	async findOrCreate(data: MessageDto): Promise<MessageId> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.findOrCreate(data);
		});
	}

	async deletebyCommunityId(communityId: MessageCommunityId): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.deletebyCommunityId(communityId);
		});
	}

	async deleteByCommunityIdAndClientId(
		communityId: MessageCommunityId,
		clientId: MessageClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.deleteByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async deletebyClientId(
		communityId: MessageCommunityId,
		clientId: MessageClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.deleteByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async deleteNotBelongByCommunityIdAndClientIds(
		communityId: MessageCommunityId,
		clientIds: MessageClientId[],
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.deleteNotBelongByCommunityIdAndClientIds(
				communityId,
				clientIds,
			);
		});
	}

	async getId(data: MessageDto): Promise<MessageId | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.getId(data);
		});
	}

	async getIdByCommunityIdAndClientId(
		communityId: MessageCommunityId,
		clientId: MessageClientId,
	): Promise<MessageId | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.getIdByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async getClientIdById(id: MessageId): Promise<MessageClientId | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.getClientIdById(id);
		});
	}

	async deleteByUserIdAndReturnClientIds(
		userId: MessageUserId,
	): Promise<MessageClientId[]> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.deleteByUserIdAndReturnClientIds(
				userId,
			);
		});
	}

	async deleteByChannelIdAndReturnClientIds(
		channelId: MessageChannelId,
	): Promise<MessageClientId[]> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.deleteByChannelIdAndReturnClientIds(
				channelId,
			);
		});
	}

	async findByBatchStatusAndDeletedAt(): Promise<MessageId[]> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.findByBatchStatusAndDeletedAt();
		});
	}

	async findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedMessageTargetDto[]
	> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.findDeletionTargetsByBatchStatusAndDeletedAt();
		});
	}

	async updatebatchStatus(id: MessageId): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.MessageRepository.updatebatchStatus(id);
		});
	}
}
