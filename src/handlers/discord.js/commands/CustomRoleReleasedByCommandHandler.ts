import { CommandsConst } from "@/src/entities/constants/Commands";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import type { CustomRoleCommandDto } from "@/src/entities/dto/CustomRoleCommandDto";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import { CommandType } from "@/src/entities/vo/CommandType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CustomRoleCommandIsAllow } from "@/src/entities/vo/CustomRoleCommandIsAllow";
import { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ICustomRoleLogic } from "@/src/logics/Interfaces/logics/ICustomRoleLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CustomRoleReleasedByCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	isHandle(commandName: string): boolean {
		return commandName === "customrolereleasedbycommand";
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

		// Get all custom roles
		const customRoles =
			await this.customRoleLogic.getAllCustomRoles(communityId);

		if (customRoles.length === 0) {
			await interaction.reply("カスタムロールが見つからなかったよ！っ");
			return;
		}

		// Create select menu for custom roles (表示はname、値はid)
		const customRoleSelect = new StringSelectMenuBuilder()
			.setCustomId("customRoleSelect")
			.setPlaceholder("カスタムロールを選択してください")
			.addOptions(
				customRoles.map((role) =>
					new StringSelectMenuOptionBuilder()
						.setLabel(role.name.getValue())
						.setValue(role.id.getValue().toString()),
				),
			);

		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			customRoleSelect,
		);

		const response = await interaction.reply({
			content: "コマンド権限を解除するカスタムロールを選択してください：",
			components: [row],
			ephemeral: true,
		});

		// Wait for selection
		const collectorFilter = (i: { user: { id: string } }) =>
			i.user.id === interaction.user.id;

		try {
			const selectInteraction = await response.awaitMessageComponent({
				filter: collectorFilter,
				time: 60000,
			});

			if (!selectInteraction.isStringSelectMenu()) {
				return;
			}

			const selectedCustomRoleId = new CustomRoleId(
				Number.parseInt(selectInteraction.values[0]),
			);

			// Get custom role details
			const selectedCustomRole =
				await this.customRoleLogic.getCustomRoleById(selectedCustomRoleId);
			if (!selectedCustomRole) {
				await selectInteraction.update({
					content: "カスタムロールが見つからなかったよ！っ",
					components: [],
				});
				return;
			}

			// Get existing permissions for this custom role
			const existingPermissions =
				await this.customRoleLogic.getCommandPermissionsByCustomRoleId(
					communityId,
					selectedCustomRoleId,
				);

			if (existingPermissions.length === 0) {
				await selectInteraction.update({
					content: "このカスタムロールにはコマンド権限が設定されていないよ！っ",
					components: [],
				});
				return;
			}

			// Create permission map for quick lookup
			const permissionMap = new Map(
				existingPermissions.map((p: CustomRoleCommandDto) => [
					`${p.commandCategoryType.getValue()}-${p.commandType.getValue()}`,
					p.isAllow.getValue(),
				]),
			);

			// Create select menu for commands (only show commands with permissions)
			const commandsWithPermissions = CommandsConst.Commands.filter((cmd) => {
				const key = `${cmd.commandCategoryType}-${cmd.commandType}`;
				return permissionMap.has(key);
			});

			if (commandsWithPermissions.length === 0) {
				await selectInteraction.update({
					content: "このカスタムロールにはコマンド権限が設定されていないよ！っ",
					components: [],
				});
				return;
			}

			// 権限が設定されているカテゴリ一覧を取得
			const categoriesWithPermissions = Array.from(
				new Set(commandsWithPermissions.map((cmd) => cmd.commandCategoryType)),
			).sort((a, b) => a - b);

			// カテゴリ選択メニューを作成
			const categorySelect = new StringSelectMenuBuilder()
				.setCustomId("categorySelect")
				.setPlaceholder("コマンドカテゴリを選択してください")
				.addOptions(
					categoriesWithPermissions.map((categoryType) =>
						new StringSelectMenuOptionBuilder()
							.setLabel(
								CommandsConst.CategoryNames[categoryType] ||
									`カテゴリ${categoryType}`,
							)
							.setValue(categoryType.toString()),
					),
				);

			const categoryRow =
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					categorySelect,
				);

			await selectInteraction.update({
				content: `カスタムロール「${selectedCustomRole.name.getValue()}」から解除するコマンドのカテゴリを選択してください：`,
				components: [categoryRow],
			});

			// Wait for category selection
			const categoryInteraction =
				await selectInteraction.message.awaitMessageComponent({
					filter: collectorFilter,
					time: 60000,
				});

			if (!categoryInteraction.isStringSelectMenu()) {
				return;
			}

			const selectedCategoryType = Number.parseInt(
				categoryInteraction.values[0],
			);

			// 選択されたカテゴリで権限があるコマンド一覧を取得
			const categoryCommandsWithPermissions = commandsWithPermissions.filter(
				(cmd) => cmd.commandCategoryType === selectedCategoryType,
			);

			// コマンド選択メニューを作成
			const commandSelect = new StringSelectMenuBuilder()
				.setCustomId("commandSelect")
				.setPlaceholder("解除するコマンドを選択してください")
				.addOptions(
					categoryCommandsWithPermissions.map((cmd) => {
						const key = `${cmd.commandCategoryType}-${cmd.commandType}`;
						const isAllowed = permissionMap.get(key);
						const status = isAllowed === true ? " ✅" : " ❌";
						return new StringSelectMenuOptionBuilder()
							.setLabel(`${cmd.name}${status}`)
							.setValue(`${cmd.commandCategoryType}-${cmd.commandType}`)
							.setDescription(isAllowed === true ? "許可" : "拒否");
					}),
				);

			const commandRow =
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					commandSelect,
				);

			await categoryInteraction.update({
				content: `カテゴリ「${CommandsConst.CategoryNames[selectedCategoryType]}」から解除するコマンドを選択してください：`,
				components: [commandRow],
			});

			// Wait for command selection
			const commandInteraction =
				await categoryInteraction.message.awaitMessageComponent({
					filter: collectorFilter,
					time: 60000,
				});

			if (!commandInteraction.isStringSelectMenu()) {
				return;
			}

			const [categoryTypeStr, commandTypeStr] =
				commandInteraction.values[0].split("-");
			const selectedCommand = CommandsConst.Commands.find(
				(cmd) =>
					cmd.commandCategoryType === Number.parseInt(categoryTypeStr) &&
					cmd.commandType === Number.parseInt(commandTypeStr),
			);

			if (!selectedCommand) {
				await commandInteraction.update({
					content: "コマンドが見つからなかったよ！っ",
					components: [],
				});
				return;
			}

			// Set isAllow to false to release permission
			const result = await this.customRoleLogic.updateCommandPermission(
				communityId,
				selectedCustomRoleId,
				new CommandCategoryType(selectedCommand.commandCategoryType),
				new CommandType(selectedCommand.commandType),
				new CustomRoleCommandIsAllow(false),
			);

			await commandInteraction.update({
				content: result,
				components: [],
			});
		} catch (error) {
			console.error(error);
			await interaction.editReply({
				content: "タイムアウトしたよ！っ",
				components: [],
			});
		}
	}
}
