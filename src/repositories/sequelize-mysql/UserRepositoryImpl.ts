import { UserDto } from "@/src/entities/dto/UserDto";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
import { injectable } from "inversify";
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

	async create(data: UserDto): Promise<boolean> {
		return UserRepositoryImpl.create({
			categoryType: data.categoryType.getValue(),
			clientId: data.clientId.getValue(),
			communityId: data.communityId.getValue(),
		}).then((res) => !!res);
	}

	async delete(
		categoryType: UserCategoryType,
		clientId: UserClientId,
	): Promise<boolean> {
		return UserRepositoryImpl.destroy({
			where: {
				categoryType: categoryType.getValue(),
				clientId: clientId.getValue(),
			},
		}).then((res) => !!res);
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
