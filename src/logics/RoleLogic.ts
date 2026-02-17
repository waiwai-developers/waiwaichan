import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { DeletedRoleTargetDto } from "@/src/entities/dto/DeletedRoleTargetDto";
import type { RoleCustomRoleDto } from "@/src/entities/dto/RoleCustomRoleDto";
import type { RoleDto } from "@/src/entities/dto/RoleDto";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import { RoleCustomRoleCommunityId } from "@/src/entities/vo/RoleCustomRoleCommunityId";
import type { RoleId } from "@/src/entities/vo/RoleId";
import type { IRoleLogic } from "@/src/logics/Interfaces/logics/IRoleLogic";
import type { IRoleCustomRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRoleCustomRoleRepository";
import type { IRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRoleRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { inject, injectable } from "inversify";

@injectable()
export class RoleLogic implements IRoleLogic {
	@inject(RepoTypes.RoleRepository)
	private readonly RoleRepository!: IRoleRepository;

	@inject(RepoTypes.RoleCustomRoleRepository)
	private readonly roleCustomRoleRepository!: IRoleCustomRoleRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	async bulkCreate(data: RoleDto[]): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.bulkCreate(data);
		});
	}

	async deletebyCommunityId(communityId: RoleCommunityId): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.deletebyCommunityId(communityId);
		});
	}

	async deleteByCommunityIdAndClientId(
		communityId: RoleCommunityId,
		clientId: RoleClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.deleteByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async deletebyClientId(
		communityId: RoleCommunityId,
		clientId: RoleClientId,
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.deleteByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async deleteNotBelongByCommunityIdAndClientIds(
		communityId: RoleCommunityId,
		clientIds: RoleClientId[],
	): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.deleteNotBelongByCommunityIdAndClientIds(
				communityId,
				clientIds,
			);
		});
	}

	async getId(data: RoleDto): Promise<RoleId | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.getId(data);
		});
	}

	async getIdByCommunityIdAndClientId(
		communityId: RoleCommunityId,
		clientId: RoleClientId,
	): Promise<RoleId | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.getIdByCommunityIdAndClientId(
				communityId,
				clientId,
			);
		});
	}

	async getClientIdById(id: RoleId): Promise<RoleClientId | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.getClientIdById(id);
		});
	}

	async findByBatchStatusAndDeletedAt(): Promise<RoleId[]> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.findByBatchStatusAndDeletedAt();
		});
	}

	async findDeletionTargetsByBatchStatusAndDeletedAt(): Promise<
		DeletedRoleTargetDto[]
	> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.findDeletionTargetsByBatchStatusAndDeletedAt();
		});
	}

	async updatebatchStatus(id: RoleId): Promise<boolean> {
		return this.transaction.startTransaction(async () => {
			return await this.RoleRepository.updatebatchStatus(id);
		});
	}

	async getRoleCustomRoleByRoleId(
		communityId: CommunityId,
		roleId: RoleId,
	): Promise<RoleCustomRoleDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.roleCustomRoleRepository.findByRoleId(
				new RoleCustomRoleCommunityId(communityId.getValue()),
				roleId,
			);
		});
	}
}
