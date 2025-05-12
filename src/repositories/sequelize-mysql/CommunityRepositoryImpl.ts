import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
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

	async create(data: CommunityDto): Promise<boolean> {
		return CommunityRepositoryImpl.create({
			categoryType: data.categoryType.getValue(),
			clientId: data.clientId.getValue(),
		}).then((res) => !!res);
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

	toDto(): CommunityDto {
		return new CommunityDto(
			new CommunityCategoryType(this.categoryType),
			new CommunityClientId(this.clientId),
		);
	}
}
export { CommunityRepositoryImpl };
