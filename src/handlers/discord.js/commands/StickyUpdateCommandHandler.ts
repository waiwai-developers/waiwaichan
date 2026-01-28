import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { StickyMessage } from "@/src/entities/vo/StickyMessage";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
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

	@inject(LogicTypes.ChannelLogic)
	private ChannelLogic!: IChannelLogic;

	@inject(LogicTypes.MessageLogic)
	private MessageLogic!: IMessageLogic;

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

		const channel = interaction.guild?.channels.cache.get(
			interaction.options.getString("channelid", true),
		);
		if (!(channel instanceof TextChannel)) {
			await interaction.reply(
				"このチャンネルにはスティッキーを登録できないよ！っ",
			);
			return;
		}

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (communityId == null) {
			await interaction.reply("コミュニティが登録されていなかったよ！っ");
			return;
		}

		const channelId = await this.ChannelLogic.getId(
			new ChannelDto(
				ChannelCategoryType.Discord,
				new ChannelClientId(
					BigInt(interaction.options.getString("channelid", true)),
				),
				ChannelType.DiscordText,
				new ChannelCommunityId(communityId.getValue()),
			),
		);
		if (channelId == null) {
			await interaction.reply("チャンネルが登録されていなかったよ！っ");
			return;
		}

		const sticky = await this.stickyLogic.find(communityId, channelId);
		if (sticky === undefined) {
			await interaction.reply("スティッキーが登録されていなかったよ！っ");
			return;
		}

		// MessageテーブルからclientIdを取得
		const messageClientId = await this.MessageLogic.getClientIdById(
			sticky.messageId,
		);
		if (messageClientId == null) {
			await interaction.reply(
				"スティッキーのメッセージが見つからなかったよ！っ",
			);
			return;
		}

		const message = await channel.messages.fetch(
			messageClientId.getValue().toString(),
		);

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
						channelId,
						new StickyMessage(message.content),
					),
				);
			})
			.catch(console.error);
	}
}
