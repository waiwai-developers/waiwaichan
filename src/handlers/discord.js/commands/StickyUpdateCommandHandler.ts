import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { StickyMessage } from "@/src/entities/vo/StickyMessage";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import {
	ActionRowBuilder,
	ModalBuilder,
	TextChannel,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class StickyUpdateCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.StickyLogic)
	private stickyLogic!: IStickyLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "stickyupdate";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}
		if (interaction.channel == null) {
			return;
		}
		// NOTE: todo CommunityとUserの追加を行ったあとにrbacを実現する
		if (
			RoleConfig.users.find((u) => u.discordId === interaction.user.id)
				?.role !== "admin"
		) {
			interaction.reply("スティッキーを更新する権限を持っていないよ！っ");
			return;
		}

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (communityId == null) {
			return;
		}

		const sticky = await this.stickyLogic.find(
			communityId,
			new DiscordChannelId(interaction.options.getString("channelid", true)),
		);
		if (sticky === undefined) {
			await interaction.reply("スティッキーが登録されていなかったよ！っ");
			return;
		}

		const channel = interaction.guild?.channels.cache.get(
			interaction.options.getString("channelid", true),
		);
		if (!(channel instanceof TextChannel)) {
			await interaction.reply(
				"このチャンネルにはスティッキーを登録できないよ！っ",
			);
			return;
		}

		const message = await channel.messages.fetch(sticky.messageId.getValue());

		const modal = new ModalBuilder()
			.setCustomId("stickyModal")
			.setTitle("スティッキーの更新");
		const textInput = new TextInputBuilder()
			.setCustomId("stickyInput")
			.setLabel("スティッキーの文章")
			.setStyle(TextInputStyle.Paragraph)
			.setValue(sticky.message.getValue());
		modal.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(textInput),
		);

		await interaction.showModal(modal);
		await interaction
			.awaitModalSubmit({ time: 60000 })
			.then(async (t) => {
				if (!interaction.guildId) {
					return;
				}
				const modalInputText = t.fields.getTextInputValue("stickyInput");
				if (!modalInputText) {
					await t.reply("スティッキーに登録するメッセージがないよ！っ");
					return;
				}

				await message.edit(modalInputText);

				await t.reply(
					await this.stickyLogic.updateMessage(
						communityId,
						new DiscordChannelId(
							interaction.options.getString("channelid", true),
						),
						new StickyMessage(message.content),
					),
				);
			})
			.catch(console.error);
	}
}
