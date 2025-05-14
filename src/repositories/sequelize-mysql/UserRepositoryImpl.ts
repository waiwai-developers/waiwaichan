import { UserDto } from "@/src/entities/dto/UserDto";
import { UserBatchStatus } from "@/src/entities/vo/UserBatchStatus";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserId } from "@/src/entities/vo/UserId";
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
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare batchStatus: number;

	async bulkCreate(data: UserDto[]): Promise<boolean> {
		return await UserRepositoryImpl.bulkCreate(
			data.map((d) => ({
				categoryType: d.categoryType.getValue(),
				clientId: d.clientId.getValue(),
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

	async deletebyClientId(clientId: UserClientId): Promise<boolean> {
		return UserRepositoryImpl.destroy({
			where: {
				clientId: clientId.getValue(),
			},
		}).then((res) => !!res);
	}

	async getId(data: UserDto): Promise<UserId | undefined> {
		return UserRepositoryImpl.findOne({
			where: {
				categoryType: data.categoryType,
				clientId: data.clientId,
				communityId: data.communityId,
			},
		}).then((res) => (res ? new UserId(res.id) : undefined));
	}

	async updatebatchStatus(id: UserId): Promise<boolean> {
		return UserRepositoryImpl.update(
			{
				batchStatus: UserBatchStatus.Done,
			},
			{
				where: {
					id: id.getValue(),
					batchStatus: UserBatchStatus.Yet,
				},
			},
		).then((res) => !!res);
	}

	toDto(): UserDto {
		return new UserDto(
			new UserCategoryType(this.categoryType),
			new UserClientId(this.clientId),
			new UserCommunityId(this.communityId),
		);
	}
}
export { UserRepositoryImpl };
