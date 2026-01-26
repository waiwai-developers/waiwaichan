import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { RoomCategoryChannelDto } from "@/src/entities/dto/RoomCategoryChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { IRoomCategoryChannelLogic } from "@/src/logics/Interfaces/logics/IRoomCategoryChannelLogic";
import type { IRoomCategoryChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomCategoryChannelRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class RoomCategoryChannelLogic
	implements IRoomCategoryChannelLogic
{
	@inject(RepoTypes.RoomCategoryChannelRepository)
	private readonly RoomCategoryChannelRepository!: IRoomCategoryChannelRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: RoomCategoryChannelDto): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomCategoryChannelRepository.create(data);
			return "カテゴリーチャンネルを登録したよ！っ";
		});
	}

	async find(
		communityId: CommunityId,
	): Promise<RoomCategoryChannelDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.RoomCategoryChannelRepository.findOne(communityId);
		});
	}

	async delete(communityId: CommunityId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomCategoryChannelRepository.delete(communityId);
			return "カテゴリーチャンネルを削除したよ！っ";
		});
	}
}
