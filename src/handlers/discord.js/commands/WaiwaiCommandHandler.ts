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
		if (!interaction.guildId || !interaction.member) {
			await interaction.reply(await this.utilLogic.waiwai());
			return;
		}

		const communityId = await this.communityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (!communityId) {
			await interaction.reply("コミュニティが登録されていなかったよ！っ");
			return;
		}

		const member = interaction.member as GuildMember;
		const userRoleClientIds = member.roles.cache.map(
			(r) => new RoleClientId(BigInt(r.id)),
		);

		const commandInfo = CommandsConst.Commands.find(
			(cmd) => cmd.name === "waiwai",
		);
		if (!commandInfo) {
			return;
		}

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

		await interaction.reply(await this.utilLogic.waiwai());
	}
}
