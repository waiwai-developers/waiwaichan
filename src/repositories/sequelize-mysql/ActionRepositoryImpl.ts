import { ActionDto } from "@/src/entities/dto/ActionDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { IActionRepository } from "@/src/logics/Interfaces/repositories/database/IActionRepository";
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
class ActionRepositoryImpl extends Model implements IActionRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.STRING)
	declare clientId: string;

	async create(data: ActionDto): Promise<boolean> {
		return ActionRepositoryImpl.create({
			categoryType: data.categoryType.getValue(),
			clientId: data.clientId.getValue(),
		}).then((res) => !!res);
	}

	async delete(data: ActionDto): Promise<boolean> {
		return ActionRepositoryImpl.destroy({
			where: {
				categoryType: data.categoryType.getValue(),
				clientId: data.clientId.getValue(),
			},
		}).then((res) => !!res);
	}

	toDto(): ActionDto {
		return new ActionDto(
			new CommunityCategoryType(this.categoryType),
			new CommunityClientId(this.clientId),
		);
	}
}
export { ActionRepositoryImpl };
