import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ColumnName } from "@/src/entities/vo/ColumnName";
import type { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { IDataDeletionCircularLogic } from "@/src/logics/Interfaces/logics/IDataDeletionCircularLogic";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
import { inject, injectable } from "inversify";

@injectable()
export class DataDeletionCircularLogic implements IDataDeletionCircularLogic {
	@inject(RepoTypes.CommunityRepository)
	private readonly communityRepository!: ICommunityRepository;

	@inject(RepoTypes.UserRepository)
	private readonly userRepository!: IUserRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	@inject(RepoTypes.DataDeletionCircular)
	private readonly dataDeletionCircular!: IDataDeletionCircular;

	async deleteRecordInRelatedTableCommunityId(
		id: CommunityId,
		clientId: CommunityClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			const deleted = await this.dataDeletionCircular.deleteRecordInRelatedTable(
				[new ColumnName("communityId"), new ColumnName("guildId")],
				[clientId, clientId],
			);
			return deleted ? this.communityRepository.updatebatchStatus(id) : false;
		});
	}

	async deleteRecordInRelatedTableUserId(
		id: UserId,
		clientId: UserClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			const deleted = await this.dataDeletionCircular.deleteRecordInRelatedTable(
				[
					new ColumnName("userId"),
					new ColumnName("receiveUserId"),
				],
				[clientId, clientId],
			);
			return deleted ? this.userRepository.updatebatchStatus(id) : false;
		});
	}
}
