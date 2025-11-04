import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";
import type { IRoomChannelLogic } from "@/src/logics/Interfaces/logics/IRoomChannelLogic";
import type { IRoomChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomChannelRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class RoomChannelLogic implements IRoomChannelLogic {
	@inject(RepoTypes.RoomChannelRepository)
	private readonly RoomChannelRepository!: IRoomChannelRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: RoomChannelDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.RoomChannelRepository.create(data);
		});
	}

	async find(data: RoomChannelDto): Promise<RoomChannelDto| undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.RoomChannelRepository.findOne(data);
		});
	}

	async delete(data: RoomChannelDto): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.RoomChannelRepository.delete(data);
		});
	}
}
