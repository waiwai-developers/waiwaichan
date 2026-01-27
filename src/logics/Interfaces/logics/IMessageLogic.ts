import type { DeletedMessageTargetDto } from "@/src/entities/dto/DeletedMessageTargetDto";
import type { MessageDto } from "@/src/entities/dto/MessageDto";
import type { MessageClientId } from "@/src/entities/vo/MessageClientId";
import type { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import type { MessageId } from "@/src/entities/vo/MessageId";

export interface IMessageLogic {
	bulkCreate(data: MessageDto[]): Promise<boolean>;
	deletebyCommunityId(communityId: MessageCommunityId): Promise<boolean>;
	deleteByCommunityIdAndClientId(
		communityId: MessageCommunityId,
		clientId: MessageClientId,
	): Promise<boolean>;
	deletebyClientId(
		communityId: MessageCommunityId,
		clientId: MessageClientId,
	): Promise<boolean>;
	getId(data: MessageDto): Promise<MessageId | undefined>;
	deleteNotBelongByCommunityIdAndClientIds(
		communityId: MessageCommunityId,
		clientIds: MessageClientId[],
	): Promise<boolean>;
	findByBatchStatusAndDeletedAt(): Promise<MessageId[]>;
	findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedMessageTargetDto[]
	>;
	updatebatchStatus(id: MessageId): Promise<boolean>;
}
