import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataDeletionCircularLogic } from "@/src/logics/Interfaces/logics/IDataDeletionCircularLogic";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";
import type { CommunityId } from "../entities/vo/CommunityId";
import type { UserId } from "../entities/vo/UserId";
import { DataDeletionCircularImpl } from "../repositories/sequelize-mysql/DataDeletionCircularImpl";
import type { IDataDeletionCircular } from "./Interfaces/repositories/database/IDataDeletionCircular";

@injectable()
export class DataDeletionCircularLogic implements IDataDeletionCircularLogic {
	@inject(RepoTypes.DataDeletionCircular)
	private readonly DataDeletionCircular!: IDataDeletionCircular;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async deleteRecordInRelatedTableCommunityId(
		id: CommunityId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.DataDeletionCircular.deleteRecordInRelatedTableCommunityId(
				id,
			);
		});
	}

	async deleteRecordInRelatedTableUserId(id: UserId): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.DataDeletionCircular.deleteRecordInRelatedTableUserId(
				id,
			);
		});
	}
}
