import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { CrownNotificationChannelDto } from "@/src/entities/dto/CrownNotificationChannelDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ICrownNotificationChannelLogic } from "@/src/logics/Interfaces/logics/ICrownNotificationChannelLogic";
import type { ICrownNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/ICrownNotificationChannelRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class CrownNotificationChannelLogic
	implements ICrownNotificationChannelLogic
{
	@inject(RepoTypes.CrownNotificationChannelRepository)
	private readonly CrownNotificationChannelRepository!: ICrownNotificationChannelRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async create(data: CrownNotificationChannelDto): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.CrownNotificationChannelRepository.create(data);
			return "クラウン通知チャンネルを登録したよ！っ";
		});
	}

	async find(
		communityId: CommunityId,
	): Promise<CrownNotificationChannelDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.CrownNotificationChannelRepository.findOne(communityId);
		});
	}

	async delete(communityId: CommunityId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			await this.CrownNotificationChannelRepository.delete(communityId);
			return "クラウン通知チャンネルを削除したよ！っ";
		});
	}
}
