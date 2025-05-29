import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { PersonalityDto } from "@/src/entities/dto/PersonalityDto";
import type { PersonalityId } from "@/src/entities/vo/PersonalityId";
import type { IPersonalityLogic } from "@/src/logics/Interfaces/logics/IPersonalityLogic";
import type { IPersonalityRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class PersonalityLogic implements IPersonalityLogic {
	@inject(RepoTypes.PersonalityRepository)
	private readonly personalityRepository!: IPersonalityRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	find(id: PersonalityId): Promise<PersonalityDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.personalityRepository.findById(id);
		});
	}
}
