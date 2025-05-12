import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { UserDto } from "@/src/entities/dto/UserDto";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
import { inject, injectable } from "inversify";

@injectable()
export class UserLogic implements IUserLogic {
	@inject(RepoTypes.UserRepository)
	private readonly UserRepository!: IUserRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: UserDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.UserRepository.create(data);
		});
	}
	async delete(data: UserDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.UserRepository.delete(data);
		});
	}
}
