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
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoleBindedByCustomRoleHandler implements SlashCommandHandler {
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	@inject(LogicTypes.RoleLogic)
	private roleLogic!: IRoleLogic;

	isHandle(commandName: string): boolean {
		return commandName === "rolebindedbycustomrole";
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
			content: "Discordロールを紐づけるカスタムロールを選択してください：",
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

			// Get guild roles
			const guildRoles = Array.from(interaction.guild.roles.cache.values());

			if (guildRoles.length === 0) {
				await selectInteraction.update({
					content: "Discordロールが見つからなかったよ！っ",
					components: [],
				});
				return;
			}

			// Create select menu for Discord roles (表示はname、値はid)
			const roleSelect = new StringSelectMenuBuilder()
				.setCustomId("roleSelect")
				.setPlaceholder("Discordロールを選択してください")
				.addOptions(
					guildRoles
						.slice(0, 25)
						.map((role) =>
							new StringSelectMenuOptionBuilder()
								.setLabel(role.name)
								.setValue(role.id)
								.setDescription(`ID: ${role.id}`),
						),
				);

			const roleRow =
				new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
					roleSelect,
				);

			await selectInteraction.update({
				content: `カスタムロール「${selectedCustomRole.name.getValue()}」に紐づけるDiscordロールを選択してください：`,
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

			const result = await this.customRoleLogic.bindRoleToCustomRole(
				communityId,
				roleId,
				selectedCustomRoleId,
			);

			await roleInteraction.update({
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
