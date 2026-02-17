import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { CustomRoleCommandDto } from "@/src/entities/dto/CustomRoleCommandDto";
import { RoleCustomRoleDto } from "@/src/entities/dto/RoleCustomRoleDto";
import type { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import type { CommandType } from "@/src/entities/vo/CommandType";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import { CustomRoleCommandCommunityId } from "@/src/entities/vo/CustomRoleCommandCommunityId";
import type { CustomRoleCommandIsAllow } from "@/src/entities/vo/CustomRoleCommandIsAllow";
import { CustomRoleCommunityId } from "@/src/entities/vo/CustomRoleCommunityId";
import type { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { CustomRoleName } from "@/src/entities/vo/CustomRoleName";
import type { RoleClientId } from "@/src/entities/vo/RoleClientId";
import { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import { RoleCustomRoleCommunityId } from "@/src/entities/vo/RoleCustomRoleCommunityId";
import type { RoleId } from "@/src/entities/vo/RoleId";
import type { ICustomRoleLogic } from "@/src/logics/Interfaces/logics/ICustomRoleLogic";
import type { ICustomRoleCommandRepository } from "@/src/logics/Interfaces/repositories/database/ICustomRoleCommandRepository";
import type { ICustomRoleRepository } from "@/src/logics/Interfaces/repositories/database/ICustomRoleRepository";
import type { IRoleCustomRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRoleCustomRoleRepository";
import type { IRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRoleRepository";
import { inject, injectable } from "inversify";

@injectable()
export class CustomRoleLogic implements ICustomRoleLogic {
	@inject(RepoTypes.CustomRoleRepository)
	private customRoleRepository!: ICustomRoleRepository;

	@inject(RepoTypes.RoleCustomRoleRepository)
	private roleCustomRoleRepository!: IRoleCustomRoleRepository;

	@inject(RepoTypes.CustomRoleCommandRepository)
	private customRoleCommandRepository!: ICustomRoleCommandRepository;

	@inject(RepoTypes.RoleRepository)
	private roleRepository!: IRoleRepository;

	async getAllCustomRoles(communityId: CommunityId) {
		return await this.customRoleRepository.findAllByCommunityId(
			new CustomRoleCommunityId(communityId.getValue()),
		);
	}

	async createCustomRole(
		communityId: CommunityId,
		name: CustomRoleName,
	): Promise<string> {
		// Check if custom role with same name already exists
		const existingCustomRole = await this.customRoleRepository.findByName(
			new CustomRoleCommunityId(communityId.getValue()),
			name,
		);

		if (existingCustomRole) {
			return "同じ名前のカスタムロールが既に存在するよ！っ";
		}

		// Create custom role
		const customRoleId = await this.customRoleRepository.create(
			new CustomRoleCommunityId(communityId.getValue()),
			name,
		);

		if (customRoleId) {
			return "カスタムロールを作成したよ！っ";
		}

		return "カスタムロールの作成に失敗したよ！っ";
	}

	async deleteCustomRole(
		communityId: CommunityId,
		id: CustomRoleId,
	): Promise<string> {
		// Check if custom role exists
		const customRole = await this.customRoleRepository.findById(id);

		if (!customRole) {
			return "カスタムロールが見つからなかったよ！っ";
		}

		// Delete all related custom role commands
		await this.customRoleCommandRepository.deleteByCustomRoleId(
			new CustomRoleCommandCommunityId(communityId.getValue()),
			id,
		);

		// Delete custom role
		const result = await this.customRoleRepository.deleteById(id);

		if (result) {
			return "カスタムロールを削除したよ！っ";
		}

		return "カスタムロールの削除に失敗したよ！っ";
	}

	async bindRoleToCustomRole(
		communityId: CommunityId,
		roleId: RoleId,
		customRoleId: CustomRoleId,
	): Promise<string> {
		// Check if custom role exists
		const customRole = await this.customRoleRepository.findById(customRoleId);

		if (!customRole) {
			return "カスタムロールが見つからなかったよ！っ";
		}

		// Check if the role is already bound to a custom role
		const existingBinding =
			await this.roleCustomRoleRepository.findByRoleId(
				new RoleCustomRoleCommunityId(communityId.getValue()),
				roleId,
			);

		if (existingBinding) {
			return "このロールは既にカスタムロールに紐づけられているよ！っ";
		}

		// Create the binding
		const result = await this.roleCustomRoleRepository.create(
			new RoleCustomRoleDto(
				new RoleCustomRoleCommunityId(communityId.getValue()),
				roleId,
				customRoleId,
			),
		);

		if (result) {
			return "ロールをカスタムロールに紐づけたよ！っ";
		}

		return "ロールの紐づけに失敗したよ！っ";
	}

	async releaseRoleFromCustomRole(
		communityId: CommunityId,
		roleId: RoleId,
	): Promise<string> {
		// Check if the role is bound to a custom role
		const existingBinding =
			await this.roleCustomRoleRepository.findByRoleId(
				new RoleCustomRoleCommunityId(communityId.getValue()),
				roleId,
			);

		if (!existingBinding) {
			return "このロールはカスタムロールに紐づけられていないよ！っ";
		}

		// Delete the binding
		const result = await this.roleCustomRoleRepository.deleteByRoleId(
			new RoleCustomRoleCommunityId(communityId.getValue()),
			roleId,
		);

		if (result) {
			return "ロールの紐づけを解除したよ！っ";
		}

		return "ロールの紐づけ解除に失敗したよ！っ";
	}

	async updateCommandPermission(
		communityId: CommunityId,
		customRoleId: CustomRoleId,
		commandCategoryType: CommandCategoryType,
		commandType: CommandType,
		isAllow: CustomRoleCommandIsAllow,
	): Promise<string> {
		// Check if custom role exists
		const customRole = await this.customRoleRepository.findById(customRoleId);

		if (!customRole) {
			return "カスタムロールが見つからなかったよ！っ";
		}

		// Update or create command permission
		const result = await this.customRoleCommandRepository.updateOrCreate(
			new CustomRoleCommandDto(
				new CustomRoleCommandCommunityId(communityId.getValue()),
				customRoleId,
				commandCategoryType,
				commandType,
				isAllow,
			),
		);

		if (result) {
			return isAllow.getValue()
				? "コマンドの実行権限を許可したよ！っ"
				: "コマンドの実行権限を拒否したよ！っ";
		}

		return "コマンドの実行権限の更新に失敗したよ！っ";
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

		// Get CustomRoleIds from RoleIds
		const customRoleIds: CustomRoleId[] = [];
		for (const roleId of roleIds) {
			const roleCustomRole =
				await this.roleCustomRoleRepository.findByRoleId(
					new RoleCustomRoleCommunityId(communityId.getValue()),
					roleId,
				);
			if (roleCustomRole) {
				customRoleIds.push(roleCustomRole.customRoleId);
			}
		}

		if (customRoleIds.length === 0) {
			return false;
		}

		// Check if user has permission to execute the command
		return await this.customRoleCommandRepository.checkCommandPermission(
			customRoleIds,
			commandCategoryType,
			commandType,
		);
	}
}
