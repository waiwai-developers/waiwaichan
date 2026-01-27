import type { DeletedMessageTargetDto } from "@/src/entities/dto/DeletedMessageTargetDto";
import { MessageDto } from "@/src/entities/dto/MessageDto";
import { MessageBatchStatus } from "@/src/entities/vo/MessageBatchStatus";
import { MessageCategoryType } from "@/src/entities/vo/MessageCategoryType";
import { MessageChannelId } from "@/src/entities/vo/MessageChannelId";
import { MessageClientId } from "@/src/entities/vo/MessageClientId";
import { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import { MessageId } from "@/src/entities/vo/MessageId";
import { MessageUserId } from "@/src/entities/vo/MessageUserId";
import type { IMessageRepository } from "@/src/logics/Interfaces/repositories/database/IMessageRepository";
import { injectable } from "inversify";
import { Op } from "sequelize";
import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "Messages",
	timestamps: true,
	paranoid: true,
})
class MessageRepositoryImpl extends Model implements IMessageRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.BIGINT)
	declare clientId: bigint;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare userId: number;
	@Column(DataType.INTEGER)
	declare channelId: number;
	@Column(DataType.INTEGER)
	declare batchStatus: number;

	async bulkCreate(data: MessageDto[]): Promise<boolean> {
		return await MessageRepositoryImpl.bulkCreate(
			data.map((d) => ({
				categoryType: d.categoryType.getValue(),
				clientId: d.clientId.getValue(),
				communityId: d.communityId.getValue(),
				userId: d.userId.getValue(),
				channelId: d.channelId.getValue(),
				batchStatus: MessageBatchStatus.Yet.getValue(),
			})),
		).then((res) => !!res);
	}

	async deletebyCommunityId(communityId: MessageCommunityId): Promise<boolean> {
		return MessageRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => !!res);
	}

	async deleteByCommunityIdAndClientId(
		communityId: MessageCommunityId,
		clientId: MessageClientId,
	): Promise<boolean> {
		return MessageRepositoryImpl.destroy({
			where: {
				clientId: clientId.getValue(),
				communityId: communityId.getValue(),
			},
		}).then((res) => !!res);
	}

	async deleteNotBelongByCommunityIdAndClientIds(
		communityId: MessageCommunityId,
		clientIds: MessageClientId[],
	): Promise<boolean> {
		return MessageRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
				clientId: { [Op.notIn]: clientIds.map((c) => c.getValue()) },
			},
		}).then((res) => !!res);
	}

	async getId(data: MessageDto): Promise<MessageId | undefined> {
		return MessageRepositoryImpl.findOne({
			where: {
				categoryType: data.categoryType.getValue(),
				clientId: data.clientId.getValue(),
				communityId: data.communityId.getValue(),
			},
		}).then((res) => (res ? new MessageId(res.id) : undefined));
	}

	async findByBatchStatusAndDeletedAt(): Promise<MessageId[]> {
		return MessageRepositoryImpl.findAll({
			where: {
				batchStatus: MessageBatchStatus.Yet.getValue(),
				deletedAt: { [Op.not]: null },
			},
			paranoid: false,
		}).then((res) => (res.length > 0 ? res.map((r) => new MessageId(r.id)) : []));
	}

	async findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedMessageTargetDto[]
	> {
		return MessageRepositoryImpl.findAll({
			attributes: ["id", "clientId"],
			where: {
				batchStatus: MessageBatchStatus.Yet.getValue(),
				deletedAt: { [Op.not]: null },
			},
			paranoid: false,
		}).then((res) =>
			res.map((r) => ({
				id: new MessageId(r.id),
				clientId: new MessageClientId(r.clientId),
			})),
		);
	}

	async updatebatchStatus(id: MessageId): Promise<boolean> {
		return MessageRepositoryImpl.update(
			{
				batchStatus: MessageBatchStatus.Done.getValue(),
			},
			{
				where: {
					id: id.getValue(),
					batchStatus: MessageBatchStatus.Yet.getValue(),
				},
				paranoid: false, // 削除されたレコードも含めて更新する
			},
		).then((res) => !!res);
	}

	toDto(): MessageDto {
		return new MessageDto(
			new MessageCategoryType(this.categoryType),
			new MessageClientId(this.clientId),
			new MessageCommunityId(this.communityId),
			new MessageUserId(this.userId),
			new MessageChannelId(this.channelId),
		);
	}
}
export { MessageRepositoryImpl };
