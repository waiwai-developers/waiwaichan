import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CustomRoleId } from "@/src/entities/vo/CustomRoleId";
import { RoleClientId } from "@/src/entities/vo/RoleClientId";
import { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ICustomRoleLogic } from "@/src/logics/Interfaces/logics/ICustomRoleLogic";
import type { IRoleLogic } from "@/src/logics/Interfaces/logics/IRoleLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoleBindToggleByCustomRoleHandler implements SlashCommandHandler {
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	@inject(LogicTypes.RoleLogic)
	private roleLogic!: IRoleLogic;

	isHandle(commandName: string): boolean {
		return commandName === "rolebindtogglebycustomrole";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}

		if (!interaction.guild) {
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

		// Create select menu for custom roles
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
			content:
				"カスタムロールを選択してDiscordロールの紐づけを管理してください：",
			components: [row],
			ephemeral: true,
		});

		// Wait for custom role selection
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

			// Get guild roles
			const guildRoles = Array.from(interaction.guild.roles.cache.values());

			if (guildRoles.length === 0) {
				await selectInteraction.update({
					content: "Discordロールが見つからなかったよ！っ",
					components: [],
				});
				return;
			}

			// Check binding status for each role
			const roleOptions = await Promise.all(
				guildRoles.slice(0, 25).map(async (role) => {
					const roleId = await this.roleLogic.getIdByCommunityIdAndClientId(
						new RoleCommunityId(communityId.getValue()),
						new RoleClientId(BigInt(role.id)),
					);

					let bindingStatus = "❌";
					let isBound = false;

					if (roleId != null) {
						const binding = await this.roleLogic.getRoleCustomRoleByRoleId(
							communityId,
							roleId,
						);
						if (
							binding &&
							binding.customRoleId.getValue() ===
								selectedCustomRoleId.getValue()
						) {
							bindingStatus = "✅";
							isBound = true;
						}
					}

					return {
						label: `${bindingStatus} ${role.name}`,
						value: role.id,
						description: isBound ? "紐づけ済み" : "未紐づけ",
					};
				}),
			);

			// Create select menu for Discord roles with binding status
			const roleSelect = new StringSelectMenuBuilder()
				.setCustomId("roleSelect")
				.setPlaceholder("Discordロールを選択してください")
				.addOptions(
					roleOptions.map((opt) =>
						new StringSelectMenuOptionBuilder()
							.setLabel(opt.label)
							.setValue(opt.value)
							.setDescription(opt.description),
					),
				);

			const roleRow =
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					roleSelect,
				);

			await selectInteraction.update({
				content: `カスタムロール「${selectedCustomRole.name.getValue()}」に対するDiscordロールを選択してください：\n✅=紐づけ済み ❌=未紐づけ`,
				components: [roleRow],
			});

			// Wait for role selection
			const roleInteraction =
				await selectInteraction.message.awaitMessageComponent({
					filter: collectorFilter,
					time: 60000,
				});

			if (!roleInteraction.isStringSelectMenu()) {
				return;
			}

			const roleClientId = roleInteraction.values[0];
			const roleId = await this.roleLogic.getIdByCommunityIdAndClientId(
				new RoleCommunityId(communityId.getValue()),
				new RoleClientId(BigInt(roleClientId)),
			);

			if (roleId == null) {
				await roleInteraction.update({
					content: "ロールが登録されていなかったよ！っ",
					components: [],
				});
				return;
			}

			// Check current binding status
			const currentBinding = await this.roleLogic.getRoleCustomRoleByRoleId(
				communityId,
				roleId,
			);
			const isBoundToThisCustomRole =
				currentBinding &&
				currentBinding.customRoleId.getValue() ===
					selectedCustomRoleId.getValue();

			// Create toggle buttons
			let buttons: ButtonBuilder[];
			if (isBoundToThisCustomRole) {
				// Already bound to this custom role - show only release button
				const releaseButton = new ButtonBuilder()
					.setCustomId("release")
					.setLabel("紐づけを解除")
					.setStyle(ButtonStyle.Danger);

				buttons = [releaseButton];
			} else if (currentBinding) {
				// Bound to a different custom role - show message
				const otherCustomRole = await this.customRoleLogic.getCustomRoleById(
					currentBinding.customRoleId,
				);
				const otherCustomRoleName = otherCustomRole
					? otherCustomRole.name.getValue()
					: "不明なカスタムロール";

				await roleInteraction.update({
					content: `このロールは既に別のカスタムロール「${otherCustomRoleName}」に紐づけられているよ！っ\n先にそちらの紐づけを解除してください。`,
					components: [],
				});
				return;
			} else {
				// Not bound - show only bind button
				const bindButton = new ButtonBuilder()
					.setCustomId("bind")
					.setLabel("紐づける")
					.setStyle(ButtonStyle.Success);

				buttons = [bindButton];
			}

			const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
				...buttons,
			);

			const selectedRoleName =
				guildRoles.find((r) => r.id === roleClientId)?.name || "不明なロール";

			await roleInteraction.update({
				content: `Discordロール「${selectedRoleName}」の操作を選択してください：`,
				components: [buttonRow],
			});

			// Wait for button click
			const buttonInteraction =
				await roleInteraction.message.awaitMessageComponent({
					filter: collectorFilter,
					time: 60000,
				});

			if (!buttonInteraction.isButton()) {
				return;
			}

			let result: string;
			if (buttonInteraction.customId === "bind") {
				result = await this.customRoleLogic.bindRoleToCustomRole(
					communityId,
					roleId,
					selectedCustomRoleId,
				);
			} else {
				result = await this.customRoleLogic.releaseRoleFromCustomRole(
					communityId,
					roleId,
				);
			}

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
