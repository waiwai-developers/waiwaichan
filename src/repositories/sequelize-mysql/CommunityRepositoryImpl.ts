import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityBatchStatus } from "@/src/entities/vo/CommunityBatchStatus";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
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
	tableName: "Communities",
	timestamps: true,
	paranoid: true,
})
class CommunityRepositoryImpl extends Model implements ICommunityRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.BIGINT)
	declare clientId: bigint;
	@Column(DataType.INTEGER)
	declare batchStatus: number;

	async create(data: CommunityDto): Promise<CommunityId> {
		return CommunityRepositoryImpl.create({
			categoryType: data.categoryType.getValue(),
			clientId: data.clientId.getValue(),
			batchStatus: CommunityBatchStatus.Yet.getValue(),
		}).then((res) => new CommunityId(res.id));
	}

	async delete(data: CommunityDto): Promise<boolean> {
		return CommunityRepositoryImpl.destroy({
			where: {
				categoryType: data.categoryType.getValue(),
				clientId: data.clientId.getValue(),
			},
		}).then((res) => !!res);
	}

	async getId(data: CommunityDto): Promise<CommunityId | undefined> {
		return CommunityRepositoryImpl.findOne({
			where: {
				categoryType: data.categoryType.getValue(),
				clientId: data.clientId.getValue(),
			},
		}).then((res) => (res ? new CommunityId(res.id) : undefined));
	}

	async getNotExistClientId(
		categoryType: CommunityCategoryType,
		clientIds: CommunityClientId[],
	): Promise<CommunityClientId[]> {
		return CommunityRepositoryImpl.findAll({
			where: {
				categoryType: categoryType.getValue(),
				clientId: { [Op.notIn]: clientIds.map((c) => c.getValue()) },
			},
		}).then((res) => res.map((r) => new CommunityClientId(r.clientId)));
	}

	async findByBatchStatusAndDeletedAt(): Promise<CommunityId[]> {
		return CommunityRepositoryImpl.findAll({
			where: {
				batchStatus: CommunityBatchStatus.Yet.getValue(),
				deletedAt: { [Op.not]: null },
			},
			paranoid: false,
		}).then((res) =>
			res.length > 0 ? res.map((r) => new CommunityId(r.id)) : [],
		);
	}

	async updatebatchStatus(id: CommunityId): Promise<boolean> {
		return CommunityRepositoryImpl.update(
			{
				batchStatus: CommunityBatchStatus.Done.getValue(),
			},
			{
				where: {
					id: id.getValue(),
					batchStatus: CommunityBatchStatus.Yet.getValue(),
				},
				paranoid: false,
			},
		).then((res) => !!res);
	}

	toDto(): CommunityDto {
		return new CommunityDto(
			new CommunityCategoryType(this.categoryType),
			new CommunityClientId(this.clientId),
		);
	}
}
export { CommunityRepositoryImpl };
