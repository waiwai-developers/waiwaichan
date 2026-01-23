import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ColumnDto } from "@/src/entities/dto/Column";
import type { ChannelId } from "@/src/entities/vo/ChannelId";
import { ColumnId } from "@/src/entities/vo/ColumnId";
import { ColumnName } from "@/src/entities/vo/ColumnName";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { UserId } from "@/src/entities/vo/UserId";
import type { IDataDeletionCircularLogic } from "@/src/logics/Interfaces/logics/IDataDeletionCircularLogic";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import { inject, injectable } from "inversify";

@injectable()
export class DataDeletionCircularLogic implements IDataDeletionCircularLogic {
	@inject(RepoTypes.DataDeletionCircular)
	private readonly dataDeletionCircular!: IDataDeletionCircular;

	async deleteRecordInRelatedTableCommunityId(
		communityId: CommunityId,
	): Promise<boolean> {
		return await this.dataDeletionCircular.deleteRecordInRelatedTable(
			new ColumnDto(ColumnName.community, new ColumnId(communityId.getValue())),
		);
	}

	async deleteRecordInRelatedTableUserId(userId: UserId): Promise<boolean> {
		return await this.dataDeletionCircular.deleteRecordInRelatedTable(
			new ColumnDto(ColumnName.user, new ColumnId(userId.getValue())),
		);
	}

	async deleteRecordInRelatedTableChannelId(
		channelId: ChannelId,
	): Promise<boolean> {
		return await this.dataDeletionCircular.deleteRecordInRelatedTable(
			new ColumnDto(ColumnName.channel, new ColumnId(channelId.getValue())),
		);
	}
}
