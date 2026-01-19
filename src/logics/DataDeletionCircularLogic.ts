import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ColumnName } from "@/src/entities/vo/ColumnName";
import type { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { IDataDeletionCircularLogic } from "@/src/logics/Interfaces/logics/IDataDeletionCircularLogic";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import { inject, injectable } from "inversify";

@injectable()
export class DataDeletionCircularLogic implements IDataDeletionCircularLogic {
	@inject(RepoTypes.DataDeletionCircular)
	private readonly dataDeletionCircular!: IDataDeletionCircular;

	async deleteRecordInRelatedTableCommunityId(
		id: CommunityId,
		clientId: CommunityClientId,
	): Promise<boolean> {
		return await this.dataDeletionCircular.deleteRecordInRelatedTable(
			[new ColumnName("communityId"), id],
			[new ColumnName("guildId"), clientId],
		);
	}

	async deleteRecordInRelatedTableUserId(
		id: UserId,
		clientId: UserClientId,
	): Promise<boolean> {
		return await this.dataDeletionCircular.deleteRecordInRelatedTable(
			[new ColumnName("userId"), id],
			[new ColumnName("userId"), clientId],
			[new ColumnName("receiveUserId"), clientId],
		);
	}
}
