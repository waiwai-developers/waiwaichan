import type { DeletedRoleTargetDto } from "@/src/entities/dto/DeletedRoleTargetDto";
import type { RoleDto } from "@/src/entities/dto/RoleDto";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import type { RoleId } from "@/src/entities/vo/RoleId";

export interface IRoleLogic {
	bulkCreate(data: RoleDto[]): Promise<boolean>;
	deletebyCommunityId(communityId: RoleCommunityId): Promise<boolean>;
	deleteByCommunityIdAndClientId(
		communityId: RoleCommunityId,
		clientId: RoleClientId,
	): Promise<boolean>;
	deletebyClientId(
		communityId: RoleCommunityId,
		clientId: RoleClientId,
	): Promise<boolean>;
	getId(data: RoleDto): Promise<RoleId | undefined>;
	getIdByCommunityIdAndClientId(
		communityId: RoleCommunityId,
		clientId: RoleClientId,
	): Promise<RoleId | undefined>;
	getClientIdById(id: RoleId): Promise<RoleClientId | undefined>;
	deleteNotBelongByCommunityIdAndClientIds(
		communityId: RoleCommunityId,
		clientIds: RoleClientId[],
	): Promise<boolean>;
	findByBatchStatusAndDeletedAt(): Promise<RoleId[]>;
	findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedRoleTargetDto[]
	>;
	updatebatchStatus(id: RoleId): Promise<boolean>;
}
