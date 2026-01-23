import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import type { DeletedChannelTargetDto } from "@/src/entities/dto/DeletedChannelTargetDto";
import { ChannelBatchStatus } from "@/src/entities/vo/ChannelBatchStatus";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import type { IChannelRepository } from "@/src/logics/Interfaces/repositories/database/IChannelRepository";
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
	tableName: "Channels",
	timestamps: true,
	paranoid: true,
})
class ChannelRepositoryImpl extends Model implements IChannelRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.BIGINT)
	declare clientId: bigint;
	@Column(DataType.INTEGER)
	declare channelType: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare batchStatus: number;

	async bulkCreate(data: ChannelDto[]): Promise<boolean> {
		return await ChannelRepositoryImpl.bulkCreate(
			data.map((d) => ({
				categoryType: d.categoryType.getValue(),
				clientId: d.clientId.getValue(),
				channelType: d.channelType.getValue(),
				communityId: d.communityId.getValue(),
				batchStatus: ChannelBatchStatus.Yet.getValue(),
			})),
		).then((res) => !!res);
	}

	async deletebyCommunityId(communityId: ChannelCommunityId): Promise<boolean> {
		return ChannelRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => !!res);
	}

	async deleteByCommunityIdAndClientId(
		communityId: ChannelCommunityId,
		clientId: ChannelClientId,
	): Promise<boolean> {
		return ChannelRepositoryImpl.destroy({
			where: {
				clientId: clientId.getValue(),
				communityId: communityId.getValue(),
			},
		}).then((res) => !!res);
	}

	async deleteNotBelongByCommunityIdAndClientIds(
		communityId: ChannelCommunityId,
		clientIds: ChannelClientId[],
	): Promise<boolean> {
		return ChannelRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
				clientId: { [Op.notIn]: clientIds.map((c) => c.getValue()) },
			},
		}).then((res) => !!res);
	}

	async getId(data: ChannelDto): Promise<ChannelId | undefined> {
		return ChannelRepositoryImpl.findOne({
			where: {
				categoryType: data.categoryType.getValue(),
				clientId: data.clientId.getValue(),
				channelType: data.channelType.getValue(),
				communityId: data.communityId.getValue(),
			},
		}).then((res) => (res ? new ChannelId(res.id) : undefined));
	}

	async getClientIdById(id: ChannelId): Promise<ChannelClientId | undefined> {
		return ChannelRepositoryImpl.findOne({
			attributes: ["clientId"],
			where: {
				id: id.getValue(),
			},
		}).then((res) => (res ? new ChannelClientId(res.clientId) : undefined));
	}

	async findByBatchStatusAndDeletedAt(): Promise<ChannelId[]> {
		return ChannelRepositoryImpl.findAll({
			where: {
				batchStatus: ChannelBatchStatus.Yet.getValue(),
				deletedAt: { [Op.not]: null },
			},
			paranoid: false,
		}).then((res) =>
			res.length > 0 ? res.map((r) => new ChannelId(r.id)) : [],
		);
	}

	async findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedChannelTargetDto[]
	> {
		return ChannelRepositoryImpl.findAll({
			attributes: ["id", "clientId"],
			where: {
				batchStatus: ChannelBatchStatus.Yet.getValue(),
				deletedAt: { [Op.not]: null },
			},
			paranoid: false,
		}).then((res) =>
			res.map((r) => ({
				id: new ChannelId(r.id),
				clientId: new ChannelClientId(r.clientId),
			})),
		);
	}

	async updatebatchStatus(id: ChannelId): Promise<boolean> {
		return ChannelRepositoryImpl.update(
			{
				batchStatus: ChannelBatchStatus.Done.getValue(),
			},
			{
				where: {
					id: id.getValue(),
					batchStatus: ChannelBatchStatus.Yet.getValue(),
				},
				paranoid: false, // 削除されたレコードも含めて更新する
			},
		).then((res) => !!res);
	}

	toDto(): ChannelDto {
		return new ChannelDto(
			new ChannelCategoryType(this.categoryType),
			new ChannelClientId(this.clientId),
			new ChannelType(this.channelType),
			new ChannelCommunityId(this.communityId),
		);
	}
}
export { ChannelRepositoryImpl };
