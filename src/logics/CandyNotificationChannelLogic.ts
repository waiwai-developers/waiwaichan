import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { CandyNotificationChannelDto } from "@/src/entities/dto/CandyNotificationChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ICandyNotificationChannelLogic } from "@/src/logics/Interfaces/logics/ICandyNotificationChannelLogic";
import type { ICandyNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/ICandyNotificationChannelRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class CandyNotificationChannelLogic
	implements ICandyNotificationChannelLogic
{
	@inject(RepoTypes.CandyNotificationChannelRepository)
	private readonly CandyNotificationChannelRepository!: ICandyNotificationChannelRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: CandyNotificationChannelDto): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.CandyNotificationChannelRepository.create(data);
			return "キャンディ通知チャンネルを登録したよ！っ";
		});
	}

	async find(
		communityId: CommunityId,
	): Promise<CandyNotificationChannelDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.CandyNotificationChannelRepository.findOne(communityId);
		});
	}

	async delete(communityId: CommunityId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.CandyNotificationChannelRepository.delete(communityId);
			return "キャンディ通知チャンネルを削除したよ！っ";
		});
	}
}
