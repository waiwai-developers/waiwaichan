import type { DeletedUserTargetDto } from "@/src/entities/dto/DeletedUserTargetDto";
import type { UserDto } from "@/src/entities/dto/UserDto";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface IUserLogic {
	bulkCreate(data: UserDto[]): Promise<boolean>;
	deletebyCommunityId(communityId: UserCommunityId): Promise<boolean>;
	deleteByCommunityIdAndClientId(
		communityId: UserCommunityId,
		clientId: UserClientId,
	): Promise<boolean>;
	deletebyClientId(
		communityId: UserCommunityId,
		clientId: UserClientId,
	): Promise<boolean>;
	getId(data: UserDto): Promise<UserId | undefined>;
	getIdByCommunityIdAndClientId(
		communityId: UserCommunityId,
		clientId: UserClientId,
	): Promise<UserId | undefined>;
	deleteNotBelongByCommunityIdAndClientIds(
		communityId: UserCommunityId,
		clientIds: UserClientId[],
	): Promise<boolean>;
	findByBatchStatusAndDeletedAt(): Promise<UserId[]>;
	findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedUserTargetDto[]
	>;
	updatebatchStatus(id: UserId): Promise<boolean>;
}
