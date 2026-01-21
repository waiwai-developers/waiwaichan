import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { IRoomAddChannelLogic } from "@/src/logics/Interfaces/logics/IRoomAddChannelLogic";
import type { IRoomAddChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomAddChannelRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class RoomAddChannelLogic implements IRoomAddChannelLogic {
	@inject(RepoTypes.RoomAddChannelRepository)
	private readonly RoomAddChannelRepository!: IRoomAddChannelRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: RoomAddChannelDto): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomAddChannelRepository.create(data);
			return "部屋追加チャンネルを登録したよ！っ";
		});
	}

	async find(communityId: CommunityId): Promise<RoomAddChannelDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.RoomAddChannelRepository.findOne(communityId);
		});
	}

	async delete(communityId: CommunityId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomAddChannelRepository.delete(communityId);
			return "部屋追加チャンネルを削除したよ！っ";
		});
	}
}
