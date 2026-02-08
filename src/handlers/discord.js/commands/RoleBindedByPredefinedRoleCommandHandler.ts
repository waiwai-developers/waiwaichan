import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { PredefinedRoleId } from "@/src/entities/vo/PredefinedRoleId";
import { RoleClientId } from "@/src/entities/vo/RoleClientId";
import { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IPredefinedRoleLogic } from "@/src/logics/Interfaces/logics/IPredefinedRoleLogic";
import type { IRoleLogic } from "@/src/logics/Interfaces/logics/IRoleLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";

@injectable()
export class RoleBindedByPredefinedRoleCommandHandler
	implements SlashCommandHandler
{
	@inject(LogicTypes.PredefinedRoleLogic)
	private predefinedRoleLogic!: IPredefinedRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	@inject(LogicTypes.RoleLogic)
	private roleLogic!: IRoleLogic;

	isHandle(commandName: string): boolean {
		return commandName === "rolebindedbypredefinedrole";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}

		// Check if user has admin role
		if (
			RoleConfig.users.find((u) => u.discordId === interaction.user.id)
				?.role !== "admin"
		) {
			await interaction.reply(
				"ロールを紐づける権限を持っていないよ！っ",
			);
			return;
		}

		// Get community ID
		const communityId = await this.communityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (communityId == null) {
			await interaction.reply("コミュニティが登録されていなかったよ！っ");
			return;
		}

		// Get predefined role ID from command options
		const predefinedRoleIdValue = interaction.options.getInteger(
			"predefinedrole",
			true,
		);
		const predefinedRoleId = new PredefinedRoleId(predefinedRoleIdValue);

		// Get role ID from command options
		const roleClientIdValue = interaction.options.getString("roleid", true);
		const roleClientId = new RoleClientId(BigInt(roleClientIdValue));

		// Get role ID from database
		const roleId = await this.roleLogic.getIdByCommunityIdAndClientId(
			new RoleCommunityId(communityId.getValue()),
			roleClientId,
		);

		if (roleId == null) {
			await interaction.reply("ロールが登録されていなかったよ！っ");
			return;
		}

		// Bind role to predefined role
		const result = await this.predefinedRoleLogic.bindRoleToPredefinedRole(
			roleId,
			predefinedRoleId,
		);

		await interaction.reply(result);
	}
}
