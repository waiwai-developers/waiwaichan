import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { IRoomNotificationChannelLogic } from "@/src/logics/Interfaces/logics/IRoomNotificationChannelLogic";
import type { IRoomNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomNotificationChannelRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class RoomNotificationChannelLogic
	implements IRoomNotificationChannelLogic
{
	@inject(RepoTypes.RoomNotificationChannelRepository)
	private readonly RoomNotificationChannelRepository!: IRoomNotificationChannelRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: RoomNotificationChannelDto): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomNotificationChannelRepository.create(data);
			return "部屋通知チャンネルを登録したよ！っ";
		});
	}

	async find(
		communityId: CommunityId,
	): Promise<RoomNotificationChannelDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.RoomNotificationChannelRepository.findOne(communityId);
		});
	}

	async delete(communityId: CommunityId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.RoomNotificationChannelRepository.delete(communityId);
			return "部屋通知チャンネルを削除したよ！っ";
		});
	}
}
