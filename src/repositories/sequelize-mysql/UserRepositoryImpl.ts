import { DeletedUserTargetDto } from "@/src/entities/dto/DeletedUserTargetDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { UserBatchStatus } from "@/src/entities/vo/UserBatchStatus";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserId } from "@/src/entities/vo/UserId";
import { UserType } from "@/src/entities/vo/UserType";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
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
	tableName: "Users",
	timestamps: true,
	paranoid: true,
})
class UserRepositoryImpl extends Model implements IUserRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.BIGINT)
	declare clientId: bigint;
	@Column(DataType.INTEGER)
	declare userType: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare batchStatus: number;

	async bulkCreate(data: UserDto[]): Promise<boolean> {
		return await UserRepositoryImpl.bulkCreate(
			data.map((d) => ({
				categoryType: d.categoryType.getValue(),
				clientId: d.clientId.getValue(),
				userType: d.userType.getValue(),
				communityId: d.communityId.getValue(),
				batchStatus: UserBatchStatus.Yet.getValue(),
			})),
		).then((res) => !!res);
	}

	async deletebyCommunityId(communityId: UserCommunityId): Promise<boolean> {
		return UserRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => !!res);
	}

	async deleteByCommunityIdAndClientId(
		communityId: UserCommunityId,
		clientId: UserClientId,
	): Promise<boolean> {
		return UserRepositoryImpl.destroy({
			where: {
				clientId: clientId.getValue(),
				communityId: communityId.getValue(),
			},
		}).then((res) => !!res);
	}

	async deleteNotBelongByCommunityIdAndClientIds(
		communityId: UserCommunityId,
		clientIds: UserClientId[],
	): Promise<boolean> {
		return UserRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
				clientId: { [Op.notIn]: clientIds.map((c) => c.getValue()) },
			},
		}).then((res) => !!res);
	}

	async getId(data: UserDto): Promise<UserId | undefined> {
		return UserRepositoryImpl.findOne({
			where: {
				categoryType: data.categoryType.getValue(),
				clientId: data.clientId.getValue(),
				userType: data.userType.getValue(),
				communityId: data.communityId.getValue(),
			},
		}).then((res) => (res ? new UserId(res.id) : undefined));
	}

	async findByBatchStatusAndDeletedAt(): Promise<UserId[]> {
		return UserRepositoryImpl.findAll({
			where: {
				batchStatus: UserBatchStatus.Yet.getValue(),
				deletedAt: { [Op.not]: null },
			},
			paranoid: false,
		}).then((res) => (res.length > 0 ? res.map((r) => new UserId(r.id)) : []));
	}

	async findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedUserTargetDto[]
	> {
		return UserRepositoryImpl.findAll({
			attributes: ["id", "clientId"],
			where: {
				batchStatus: UserBatchStatus.Yet.getValue(),
				deletedAt: { [Op.not]: null },
			},
			paranoid: false,
		}).then((res) =>
			res.map((r) => ({
				id: new UserId(r.id),
				clientId: new UserClientId(r.clientId),
			})),
		);
	}

	async updatebatchStatus(id: UserId): Promise<boolean> {
		return UserRepositoryImpl.update(
			{
				batchStatus: UserBatchStatus.Done.getValue(),
			},
			{
				where: {
					id: id.getValue(),
					batchStatus: UserBatchStatus.Yet.getValue(),
				},
				paranoid: false, // 削除されたレコードも含めて更新する
			},
		).then((res) => !!res);
	}

	toDto(): UserDto {
		return new UserDto(
			new UserCategoryType(this.categoryType),
			new UserClientId(this.clientId),
			new UserType(this.userType),
			new UserCommunityId(this.communityId),
		);
	}
}
export { UserRepositoryImpl };
