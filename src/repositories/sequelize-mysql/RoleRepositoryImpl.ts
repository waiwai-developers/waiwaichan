import { RoleDto } from "@/src/entities/dto/RoleDto";
import type { DeletedRoleTargetDto } from "@/src/entities/dto/DeletedRoleTargetDto";
import { RoleBatchStatus } from "@/src/entities/vo/RoleBatchStatus";
import { RoleCategoryType } from "@/src/entities/vo/RoleCategoryType";
import { RoleClientId } from "@/src/entities/vo/RoleClientId";
import { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import { RoleId } from "@/src/entities/vo/RoleId";
import type { IRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRoleRepository";
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
	tableName: "Roles",
	timestamps: true,
	paranoid: true,
})
class RoleRepositoryImpl extends Model implements IRoleRepository {
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
	declare batchStatus: number;

	async bulkCreate(data: RoleDto[]): Promise<boolean> {
		return await RoleRepositoryImpl.bulkCreate(
			data.map((d) => ({
				categoryType: d.categoryType.getValue(),
				clientId: d.clientId.getValue(),
				communityId: d.communityId.getValue(),
				batchStatus: RoleBatchStatus.Yet.getValue(),
			})),
		).then((res) => !!res);
	}

	async deletebyCommunityId(communityId: RoleCommunityId): Promise<boolean> {
		return RoleRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => !!res);
	}

	async deleteByCommunityIdAndClientId(
		communityId: RoleCommunityId,
		clientId: RoleClientId,
	): Promise<boolean> {
		return RoleRepositoryImpl.destroy({
			where: {
				clientId: clientId.getValue(),
				communityId: communityId.getValue(),
			},
		}).then((res) => !!res);
	}

	async deleteNotBelongByCommunityIdAndClientIds(
		communityId: RoleCommunityId,
		clientIds: RoleClientId[],
	): Promise<boolean> {
		return RoleRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
				clientId: { [Op.notIn]: clientIds.map((c) => c.getValue()) },
			},
		}).then((res) => !!res);
	}

	async getId(data: RoleDto): Promise<RoleId | undefined> {
		return RoleRepositoryImpl.findOne({
			where: {
				categoryType: data.categoryType.getValue(),
				clientId: data.clientId.getValue(),
				communityId: data.communityId.getValue(),
			},
		}).then((res) => (res ? new RoleId(res.id) : undefined));
	}

	async getIdByCommunityIdAndClientId(
		communityId: RoleCommunityId,
		clientId: RoleClientId,
	): Promise<RoleId | undefined> {
		return RoleRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
				clientId: clientId.getValue(),
			},
		}).then((res) => (res ? new RoleId(res.id) : undefined));
	}

	async getClientIdById(id: RoleId): Promise<RoleClientId | undefined> {
		return RoleRepositoryImpl.findOne({
			attributes: ["clientId"],
			where: {
				id: id.getValue(),
			},
		}).then((res) => (res ? new RoleClientId(res.clientId) : undefined));
	}

	async findByBatchStatusAndDeletedAt(): Promise<RoleId[]> {
		return RoleRepositoryImpl.findAll({
			where: {
				batchStatus: RoleBatchStatus.Yet.getValue(),
				deletedAt: { [Op.not]: null },
			},
			paranoid: false,
		}).then((res) =>
			res.length > 0 ? res.map((r) => new RoleId(r.id)) : [],
		);
	}

	async findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedRoleTargetDto[]
	> {
		return RoleRepositoryImpl.findAll({
			attributes: ["id", "clientId"],
			where: {
				batchStatus: RoleBatchStatus.Yet.getValue(),
				deletedAt: { [Op.not]: null },
			},
			paranoid: false,
		}).then((res) =>
			res.map((r) => ({
				id: new RoleId(r.id),
				clientId: new RoleClientId(r.clientId),
			})),
		);
	}

	async updatebatchStatus(id: RoleId): Promise<boolean> {
		return RoleRepositoryImpl.update(
			{
				batchStatus: RoleBatchStatus.Done.getValue(),
			},
			{
				where: {
					id: id.getValue(),
					batchStatus: RoleBatchStatus.Yet.getValue(),
				},
				paranoid: false, // 削除されたレコードも含めて更新する
			},
		).then((res) => !!res);
	}

	toDto(): RoleDto {
		return new RoleDto(
			new RoleCategoryType(this.categoryType),
			new RoleClientId(this.clientId),
			new RoleCommunityId(this.communityId),
		);
	}
}
export { RoleRepositoryImpl };
