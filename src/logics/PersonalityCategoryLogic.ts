import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { PersonalityCategoryDto } from "@/src/entities/dto/PersonalityCategoryDto";
import type { PersonalityCategoryId } from "@/src/entities/vo/PersonalityCategoryId";
import type { PersonalityCategoryPersonalityId } from "@/src/entities/vo/PersonalityCategoryPersonalityId";

import type { IPersonalityCategoryLogic } from "@/src/logics/Interfaces/logics/IPersonalityCategoryLogic";
import type { IPersonalityCategoryRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityCategoryRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";

import { inject, injectable } from "inversify";

@injectable()
export class PersonalityCategoryLogic implements IPersonalityCategoryLogic {
	@inject(RepoTypes.PersonalityCategoryRepository)
	private readonly personalityCategoryRepository!: IPersonalityCategoryRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	find(
		id: PersonalityCategoryId,
		personalityId: PersonalityCategoryPersonalityId,
	): Promise<PersonalityCategoryDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.personalityCategoryRepository.findByIdAndPersonalityId(
				id,
				personalityId,
			);
		});
	}
}
