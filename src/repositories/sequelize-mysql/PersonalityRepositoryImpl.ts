import { PersonalityDto } from "@/src/entities/dto/PersonalityDto";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { PersonalityName } from "@/src/entities/vo/PersonalityName";
import { PersonalityPersonality } from "@/src/entities/vo/PersonalityPersonality";

import type { IPersonalityRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityRepository";
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
	tableName: "Personalitys",
	timestamps: true,
	paranoid: true,
})
class PersonalityRepositoryImpl
	extends Model
	implements IPersonalityRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare name: string;
	@Column(DataType.JSON)
	declare personality: JSON;

	async findById(id: PersonalityId): Promise<PersonalityDto | undefined> {
		return PersonalityRepositoryImpl.findOne({
			where: {
				id: id,
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): PersonalityDto {
		return new PersonalityDto(
			new PersonalityId(this.id),
			new PersonalityName(this.name),
			new PersonalityPersonality(this.personality),
		);
	}
}
export { PersonalityRepositoryImpl };
