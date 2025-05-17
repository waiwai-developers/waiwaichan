import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { PersonalityContextDto } from "@/src/entities/dto/PersonalityContextDto";
import type { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";
import type { PersonalityContextPersonalityId } from "@/src/entities/vo/PersonalityContextPersonalityId";

import type { IPersonalityContextLogic } from "@/src/logics/Interfaces/logics/IPersonalityContextLogic";
import type { IPersonalityContextRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityContextRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";

import { inject, injectable } from "inversify";

@injectable()
export class PersonalityContextLogic implements IPersonalityContextLogic {
	@inject(RepoTypes.PersonalityContextRepository)
	private readonly personalityContextRepository!: IPersonalityContextRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	find(
		personalityId: PersonalityContextPersonalityId,
		contextId: PersonalityContextContextId,
	): Promise<PersonalityContextDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.personalityContextRepository.findBypersonalityIdAndcontextId(
				personalityId,
				contextId,
			);
		});
	}
}
