import { PersonalityCategoryDto } from "@/src/entities/dto/PersonalityCategoryDto";
import { PersonalityCategoryContext } from "@/src/entities/vo/PersonalityCategoryContext";
import type { PersonalityCategoryId } from "@/src/entities/vo/PersonalityCategoryId";
import { PersonalityCategoryName } from "@/src/entities/vo/PersonalityCategoryName";
import { PersonalityCategoryPersonalityId } from "@/src/entities/vo/PersonalityCategoryPersonalityId";

import type { IPersonalityCategoryRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityCategoryRepository";
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
	tableName: "PersonalityCategorys",
	timestamps: true,
	paranoid: true,
})
class PersonalityCategoryRepositoryImpl
	extends Model
	implements IPersonalityCategoryRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare personalityId: number;
	@Column(DataType.STRING)
	declare name: string;
	@Column(DataType.JSON)
	declare context: JSON;

	async findByIdAndPersonalityId(
		id: PersonalityCategoryId,
		personalityId: PersonalityCategoryPersonalityId,
	): Promise<PersonalityCategoryDto | undefined> {
		return PersonalityCategoryRepositoryImpl.findOne({
			where: {
				id: id,
				personalityId: personalityId,
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): PersonalityCategoryDto {
		return new PersonalityCategoryDto(
			new PersonalityCategoryPersonalityId(this.personalityId),
			new PersonalityCategoryName(this.name),
			new PersonalityCategoryContext(this.context),
		);
	}
}
export { PersonalityCategoryRepositoryImpl };
