import { PersonalityContextDto } from "@/src/entities/dto/PersonalityContextDto";
import { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";
import { PersonalityContextPersonalityId } from "@/src/entities/vo/PersonalityContextPersonalityId";
import type { IPersonalityContextRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityContextRepository";
import { injectable } from "inversify";
import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "PersonalityContexts",
	timestamps: true,
})
class PersonalityContextRepositoryImpl
	extends Model
	implements IPersonalityContextRepository
{
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare personalityId: number;
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare contextId: number;

	async findBypersonalityIdAndcontextId(
		personalityId: PersonalityContextPersonalityId,
		contextId: PersonalityContextContextId,
	): Promise<PersonalityContextDto | undefined> {
		return PersonalityContextRepositoryImpl.findOne({
			where: {
				personalityId: personalityId.getValue(),
				contextId: contextId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): PersonalityContextDto {
		return new PersonalityContextDto(
			new PersonalityContextPersonalityId(this.personalityId),
			new PersonalityContextContextId(this.contextId),
		);
	}
}
export { PersonalityContextRepositoryImpl };
