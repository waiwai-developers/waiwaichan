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
import type {
	AutocompleteInteraction,
	CacheType,
	ChatInputCommandInteraction,
} from "discord.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class CustomRoleBindToggleByCommandHandler
	implements SlashCommandHandler
{
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	isHandle(commandName: string): boolean {
		return commandName === "customrolebindtogglebycommand";
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
			content: "カスタムロールを選択してコマンド権限を設定してください：",
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

			// Create permission map for quick lookup
			const permissionMap = new Map(
				existingPermissions.map((p: CustomRoleCommandDto) => [
					`${p.commandCategoryType.getValue()}-${p.commandType.getValue()}`,
					p.isAllow.getValue(),
				]),
			);

			// カテゴリ一覧を取得
			const categories = Array.from(
				new Set(CommandsConst.Commands.map((cmd) => cmd.commandCategoryType)),
			).sort((a, b) => a - b);

			// カテゴリ選択メニューを作成
			const categorySelect = new StringSelectMenuBuilder()
				.setCustomId("categorySelect")
				.setPlaceholder("コマンドカテゴリを選択してください")
				.addOptions(
					categories.map((categoryType) =>
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
				content: `カスタムロール「${selectedCustomRole.name.getValue()}」のコマンド権限を設定：\nまずカテゴリを選択してください`,
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

			// 選択されたカテゴリのコマンド一覧を取得
			const categoryCommands = CommandsConst.Commands.filter(
				(cmd) => cmd.commandCategoryType === selectedCategoryType,
			);

			// コマンド選択メニューを作成
			const commandSelect = new StringSelectMenuBuilder()
				.setCustomId("commandSelect")
				.setPlaceholder("コマンドを選択してください")
				.addOptions(
					categoryCommands.map((cmd) => {
						const key = `${cmd.commandCategoryType}-${cmd.commandType}`;
						const isAllowed = permissionMap.get(key);
						const status =
							isAllowed === true ? " ✅" : isAllowed === false ? " ❌" : " ⚪";
						return new StringSelectMenuOptionBuilder()
							.setLabel(`${cmd.name}${status}`)
							.setValue(`${cmd.commandCategoryType}-${cmd.commandType}`)
							.setDescription(
								isAllowed === true
									? "許可"
									: isAllowed === false
										? "拒否"
										: "未設定",
							);
					}),
				);

			const commandRow =
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					commandSelect,
				);

			await categoryInteraction.update({
				content: `カテゴリ「${CommandsConst.CategoryNames[selectedCategoryType]}」のコマンドを選択してください：`,
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

			// Create toggle buttons
			const allowButton = new ButtonBuilder()
				.setCustomId("allow")
				.setLabel("許可")
				.setStyle(ButtonStyle.Success);

			const denyButton = new ButtonBuilder()
				.setCustomId("deny")
				.setLabel("拒否")
				.setStyle(ButtonStyle.Danger);

			const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
				allowButton,
				denyButton,
			);

			await commandInteraction.update({
				content: `コマンド「${selectedCommand.name}」の権限を選択してください：`,
				components: [buttonRow],
			});

			// Wait for button click
			const buttonInteraction =
				await commandInteraction.message.awaitMessageComponent({
					filter: collectorFilter,
					time: 60000,
				});

			if (!buttonInteraction.isButton()) {
				return;
			}

			const isAllow = buttonInteraction.customId === "allow";

			// Update permission
			const result = await this.customRoleLogic.updateCommandPermission(
				communityId,
				selectedCustomRoleId,
				new CommandCategoryType(selectedCommand.commandCategoryType),
				new CommandType(selectedCommand.commandType),
				new CustomRoleCommandIsAllow(isAllow),
			);

			await buttonInteraction.update({
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
