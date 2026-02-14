import { CommandsConst } from "@/src/entities/constants/Commands";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import { CommandType } from "@/src/entities/vo/CommandType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type {
	CommandPermissionCheckResult,
	ICommandPermissionChecker,
} from "@/src/handlers/discord.js/permissions/ICommandPermissionChecker";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IPredefinedRoleLogic } from "@/src/logics/Interfaces/logics/IPredefinedRoleLogic";
import type {
	CacheType,
	ChatInputCommandInteraction,
	GuildMember,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CommandPermissionChecker implements ICommandPermissionChecker {
	@inject(LogicTypes.PredefinedRoleLogic)
	private predefinedRoleLogic!: IPredefinedRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	async checkPermission(
		interaction: ChatInputCommandInteraction<CacheType>,
		commandName: string,
	): Promise<CommandPermissionCheckResult> {
		if (!interaction.guildId || !interaction.member) {
			return {
				isSuccess: false,
				errorMessage: "このコマンドはサーバー内でのみ実行できるよ！っ",
			};
		}

		const communityId = await this.getCommunityId(interaction.guildId);
		if (!communityId) {
			return {
				isSuccess: false,
				errorMessage: "コミュニティが登録されていなかったよ！っ",
			};
		}

		if (interaction.guild?.ownerId === interaction.user.id) {
			return {
				isSuccess: true,
				communityId: communityId
			};
		}

		const userRoleClientIds = this.getUserRoleClientIds(
			interaction.member as GuildMember,
		);

		const commandInfo = this.getCommandInfo(commandName);
		if (!commandInfo) {
			return {
				isSuccess: false,
				errorMessage: "コマンド情報が見つからなかったよ！っ",
			};
		}

		const hasPermission = await this.checkUserHasPermission(
			communityId,
			userRoleClientIds,
			commandInfo.commandCategoryType,
			commandInfo.commandType,
		);

		if (!hasPermission) {
			return {
				isSuccess: false,
				errorMessage: "このコマンドを実行する権限がないよ！っ",
			};
		}

		return {
			isSuccess: true,
			communityId,
		};
	}

	private async getCommunityId(guildId: string): Promise<CommunityId | null> {
		const communityId = await this.communityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(guildId)),
			),
		);
		return communityId ?? null;
	}

	private getUserRoleClientIds(member: GuildMember): RoleClientId[] {
		return member.roles.cache.map((r) => new RoleClientId(BigInt(r.id)));
	}

	private getCommandInfo(commandName: string) {
		return CommandsConst.Commands.find((cmd) => cmd.name === commandName);
	}

	private async checkUserHasPermission(
		communityId: CommunityId,
		userRoleClientIds: RoleClientId[],
		commandCategoryType: number,
		commandType: number,
	): Promise<boolean> {
		return await this.predefinedRoleLogic.checkUserCommandPermission(
			communityId,
			userRoleClientIds,
			new CommandCategoryType(commandCategoryType),
			new CommandType(commandType),
		);
	}
}
