import { CommandsConst } from "@/src/entities/constants/Commands";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import { CommandType } from "@/src/entities/vo/CommandType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { RoleClientId } from "@/src/entities/vo/RoleClientId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IPredefinedRoleLogic } from "@/src/logics/Interfaces/logics/IPredefinedRoleLogic";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type {
	CacheType,
	ChatInputCommandInteraction,
	GuildMember,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class WaiwaiCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	@inject(LogicTypes.PredefinedRoleLogic)
	private predefinedRoleLogic!: IPredefinedRoleLogic;
	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	isHandle(commandName: string): boolean {
		return commandName === "waiwai";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		// Check if interaction is from a guild
		if (!interaction.guildId || !interaction.member) {
			await interaction.reply(await this.utilLogic.waiwai());
			return;
		}

		// Get community ID
		const communityId = await this.communityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);

		if (!communityId) {
			// If community is not registered, allow command execution
			await interaction.reply(await this.utilLogic.waiwai());
			return;
		}

		// Get user's role IDs
		const member = interaction.member as GuildMember;
		const userRoleClientIds: RoleClientId[] = [];

		if (member.roles && member.roles.cache) {
			member.roles.cache.forEach((role) => {
				userRoleClientIds.push(new RoleClientId(BigInt(role.id)));
			});
		}

		// Find command info - for now allow all commands as waiwai is not in Commands list
		// You can add it to Commands.ts if needed
		const commandInfo = CommandsConst.Commands.find(
			(cmd) => cmd.name === "waiwai",
		);

		if (!commandInfo) {
			// If command is not found in Commands list, allow execution (backward compatibility)
			await interaction.reply(await this.utilLogic.waiwai());
			return;
		}

		// Check permission
		const hasPermission =
			await this.predefinedRoleLogic.checkUserCommandPermission(
				communityId,
				userRoleClientIds,
				new CommandCategoryType(commandInfo.commandCategoryType),
				new CommandType(commandInfo.commandType),
			);

		if (!hasPermission) {
			await interaction.reply("このコマンドを実行する権限がないよ！っ");
			return;
		}

		// Execute command
		await interaction.reply(await this.utilLogic.waiwai());
	}
}
