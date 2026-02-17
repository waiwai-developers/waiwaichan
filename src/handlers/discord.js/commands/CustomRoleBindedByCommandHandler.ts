import { CommandsConst } from "@/src/entities/constants/Commands";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import { CommandType } from "@/src/entities/vo/CommandType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CustomRoleCommandIsAllow } from "@/src/entities/vo/CustomRoleCommandIsAllow";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ICustomRoleLogic } from "@/src/logics/Interfaces/logics/ICustomRoleLogic";
import type {
	AutocompleteInteraction,
	CacheType,
	ChatInputCommandInteraction,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CustomRoleBindedByCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	isHandle(commandName: string): boolean {
		return commandName === "customrolebindedbycommand";
	}

	async handleAutocomplete(
		interaction: AutocompleteInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
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
			return;
		}

		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === "customrolename") {
			// Get all custom roles
			const customRoles =
				await this.customRoleLogic.getAllCustomRoles(communityId);

			// Filter based on user input
			const filtered = customRoles.filter((role) =>
				role.name
					.getValue()
					.toLowerCase()
					.includes(focusedOption.value.toLowerCase()),
			);

			// Return up to 25 results (Discord limit)
			await interaction.respond(
				filtered.slice(0, 25).map((role) => ({
					name: role.name.getValue(),
					value: role.name.getValue(),
				})),
			);
		} else if (focusedOption.name === "commandname") {
			// Get all commands
			const commands = CommandsConst.Commands;

			// Filter based on user input
			const filtered = commands.filter((cmd) =>
				cmd.name.toLowerCase().includes(focusedOption.value.toLowerCase()),
			);

			// Return up to 25 results (Discord limit)
			await interaction.respond(
				filtered.slice(0, 25).map((cmd) => ({
					name: cmd.name,
					value: cmd.name,
				})),
			);
		}
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
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

		// Get custom role name from command options
		const customRoleName = interaction.options.getString(
			"customrolename",
			true,
		);

		// Get command name from command options
		const commandName = interaction.options.getString("commandname", true);

		// Get isAllow from command options
		const isAllow = interaction.options.getBoolean("isallow", true);

		// Find custom role by name
		const customRole =
			await this.customRoleLogic.getAllCustomRoles(communityId);
		const targetCustomRole = customRole.find(
			(role) => role.name.getValue() === customRoleName,
		);

		if (!targetCustomRole) {
			await interaction.reply("カスタムロールが見つからなかったよ！っ");
			return;
		}

		// Find command by name
		const command = CommandsConst.Commands.find(
			(cmd) => cmd.name === commandName,
		);

		if (!command) {
			await interaction.reply("コマンドが見つからなかったよ！っ");
			return;
		}

		const result = await this.customRoleLogic.updateCommandPermission(
			communityId,
			targetCustomRole.id,
			new CommandCategoryType(command.commandCategoryType),
			new CommandType(command.commandType),
			new CustomRoleCommandIsAllow(isAllow),
		);

		await interaction.reply(result);
	}
}
