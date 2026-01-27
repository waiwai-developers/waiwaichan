import type { DeletedMessageTargetDto } from "@/src/entities/dto/DeletedMessageTargetDto";
import type { MessageDto } from "@/src/entities/dto/MessageDto";
import type { MessageClientId } from "@/src/entities/vo/MessageClientId";
import type { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import type { MessageId } from "@/src/entities/vo/MessageId";

export interface IMessageRepository {
	bulkCreate(data: MessageDto[]): Promise<boolean>;
	deletebyCommunityId(communityId: MessageCommunityId): Promise<boolean>;
	deleteByCommunityIdAndClientId(
		communityId: MessageCommunityId,
		clientId: MessageClientId,
	): Promise<boolean>;
	deleteNotBelongByCommunityIdAndClientIds(
		communityId: MessageCommunityId,
		clientIds: MessageClientId[],
	): Promise<boolean>;
	getId(data: MessageDto): Promise<MessageId | undefined>;
	findByBatchStatusAndDeletedAt(): Promise<MessageId[]>;
	findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedMessageTargetDto[]
	>;
	updatebatchStatus(id: MessageId): Promise<boolean>;
}
