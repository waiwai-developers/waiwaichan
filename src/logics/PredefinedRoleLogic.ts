import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { RolePredefinedRoleDto } from "@/src/entities/dto/RolePredefinedRoleDto";
import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import type { RoleId } from "@/src/entities/vo/RoleId";
import type { IPredefinedRoleLogic } from "@/src/logics/Interfaces/logics/IPredefinedRoleLogic";
import type { IPredefinedRoleCommandRepository } from "@/src/logics/Interfaces/repositories/database/IPredefinedRoleCommandRepository";
import type { IRolePredefinedRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRolePredefinedRoleRepository";
import type { IRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRoleRepository";
import { inject, injectable } from "inversify";

@injectable()
export class PredefinedRoleLogic implements IPredefinedRoleLogic {
	@inject(RepoTypes.RolePredefinedRoleRepository)
	private rolePredefinedRoleRepository!: IRolePredefinedRoleRepository;

	@inject(RepoTypes.PredefinedRoleCommandRepository)
	private predefinedRoleCommandRepository!: IPredefinedRoleCommandRepository;

	@inject(RepoTypes.RoleRepository)
	private roleRepository!: IRoleRepository;

	async bindRoleToPredefinedRole(
		roleId: RoleId,
		predefinedRoleId: PredefinedRoleId,
		communityId: CommunityId,
	): Promise<string> {
		// Check if the role is already bound to a predefined role
		const existingBinding =
			await this.rolePredefinedRoleRepository.findByRoleId(roleId);

		if (existingBinding) {
			return "このロールは既に事前定義ロールに紐づけられているよ！っ";
		}

		// Create the binding
		const result = await this.rolePredefinedRoleRepository.create(
			new RolePredefinedRoleDto(roleId, predefinedRoleId, communityId),
		);

		if (result) {
			return "ロールを事前定義ロールに紐づけたよ！っ";
		}

		return "ロールの紐づけに失敗したよ！っ";
	}

	async releaseRoleFromPredefinedRole(
		roleId: RoleId,
		communityId: CommunityId,
	): Promise<string> {
		// Check if the role is bound to a predefined role
		const existingBinding =
			await this.rolePredefinedRoleRepository.findByRoleId(roleId);

		if (!existingBinding) {
			return "このロールは事前定義ロールに紐づけられていないよ！っ";
		}

		// Delete the binding
		const result =
			await this.rolePredefinedRoleRepository.deleteByRoleId(roleId);

		if (result) {
			return "ロールの紐づけを解除したよ！っ";
		}

		return "ロールの紐づけ解除に失敗したよ！っ";
	}

	async checkUserCommandPermission(
		communityId: CommunityId,
		userRoleClientIds: RoleClientId[],
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
	): Promise<boolean> {
		// If user has no roles, deny access
		if (userRoleClientIds.length === 0) {
			return false;
		}

		// Get RoleIds from RoleClientIds
		const roleIds: RoleId[] = [];
		for (const roleClientId of userRoleClientIds) {
			const roleId = await this.roleRepository.getIdByCommunityIdAndClientId(
				new RoleCommunityId(communityId.getValue()),
				roleClientId,
			);
			if (roleId) {
				roleIds.push(roleId);
			}
		}

		if (roleIds.length === 0) {
			return false;
		}

		// Get PredefinedRoleIds from RoleIds
		const predefinedRoleIds: PredefinedRoleId[] = [];
		for (const roleId of roleIds) {
			const rolePredefinedRole =
				await this.rolePredefinedRoleRepository.findByRoleId(roleId);
			if (rolePredefinedRole) {
				predefinedRoleIds.push(rolePredefinedRole.predefinedRoleId);
			}
		}

		if (predefinedRoleIds.length === 0) {
			return false;
		}

		// Check if user has permission to execute the command
		return await this.predefinedRoleCommandRepository.checkCommandPermission(
			predefinedRoleIds,
			commandCategoryType,
			commandType,
		);
	}
}
