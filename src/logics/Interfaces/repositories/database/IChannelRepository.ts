import type { DeletedChannelTargetDto } from "@/src/entities/dto/DeletedChannelTargetDto";
import type { ChannelDto } from "@/src/entities/dto/ChannelDto";
import type { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import type { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import type { ChannelId } from "@/src/entities/vo/ChannelId";

export interface IChannelRepository {
	bulkCreate(data: ChannelDto[]): Promise<boolean>;
	deletebyCommunityId(communityId: ChannelCommunityId): Promise<boolean>;
	deleteByCommunityIdAndClientId(
		communityId: ChannelCommunityId,
		clientId: ChannelClientId,
	): Promise<boolean>;
	deleteNotBelongByCommunityIdAndClientIds(
		communityId: ChannelCommunityId,
		clientIds: ChannelClientId[],
	): Promise<boolean>;
	getId(data: ChannelDto): Promise<ChannelId | undefined>;
	findByBatchStatusAndDeletedAt(): Promise<ChannelId[]>;
	findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedChannelTargetDto[]
	>;
	updatebatchStatus(id: ChannelId): Promise<boolean>;
}
