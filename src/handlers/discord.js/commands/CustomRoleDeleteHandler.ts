import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
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
export class CustomRoleDeleteHandler implements SlashCommandHandler {
	@inject(LogicTypes.CustomRoleLogic)
	private customRoleLogic!: ICustomRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private communityLogic!: ICommunityLogic;

	isHandle(commandName: string): boolean {
		return commandName === "customroledelete";
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
			.setPlaceholder("削除するカスタムロールを選択してください")
			.addOptions(
				customRoles.map((role) =>
					new StringSelectMenuOptionBuilder()
						.setLabel(role.name.getValue())
						.setValue(role.id.getValue().toString())
						.setDescription(`ID: ${role.id.getValue()}`),
				),
			);

		const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
			customRoleSelect,
		);

		const response = await interaction.reply({
			content: "削除するカスタムロールを選択してください：",
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

			const result = await this.customRoleLogic.deleteCustomRole(
				communityId,
				selectedCustomRoleId,
			);

			await selectInteraction.update({
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
