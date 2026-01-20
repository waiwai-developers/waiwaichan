import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IDataDeletionCircularLogic } from "@/src/logics/Interfaces/logics/IDataDeletionCircularLogic";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import { inject, injectable } from "inversify";
import type { UserId } from "@/src/entities/vo/UserId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import  { ColumnDto } from "@/src/entities/dto/Column";
import  { ColumnName } from "@/src/entities/vo/ColumnName";
import  { ColumnId } from "@/src/entities/vo/ColumnId";

@injectable()
export class DataDeletionCircularLogic implements IDataDeletionCircularLogic {
	@inject(RepoTypes.DataDeletionCircular)
	private readonly dataDeletionCircular!: IDataDeletionCircular;

	async deleteRecordInRelatedTableCommunityId(
		userId: UserId,
	): Promise<boolean> {
		return await this.dataDeletionCircular.deleteRecordInRelatedTable(
			new ColumnDto(ColumnName.user ,new ColumnId(userId.getValue()))
		);
	}

	async deleteRecordInRelatedTableUserId(
		communityId: CommunityId,
	): Promise<boolean> {
		return await this.dataDeletionCircular.deleteRecordInRelatedTable(
			new ColumnDto(ColumnName.community ,new ColumnId(communityId.getValue()))
		);
	}
}
