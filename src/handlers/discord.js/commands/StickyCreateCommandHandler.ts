import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { StickyDto } from "@/src/entities/dto/StickyDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { StickyMessage } from "@/src/entities/vo/StickyMessage";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
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
export class StickyCreateCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.StickyLogic)
	private stickyLogic!: IStickyLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private UserLogic!: IUserLogic;

	@inject(LogicTypes.ChannelLogic)
	private ChannelLogic!: IChannelLogic;

	isHandle(commandName: string): boolean {
		return commandName === "stickycreate";
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
			interaction.reply("スティッキーを登録する権限を持っていないよ！っ");
			return;
		}
		if (!interaction.guildId) {
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

		const userId = await this.UserLogic.getId(
			new UserDto(
				UserCategoryType.Discord,
				new UserClientId(BigInt(interaction.user.id)),
				UserType.user,
				new UserCommunityId(communityId.getValue()),
			),
		);
		if (userId == null) {
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
			return;
		}

		const sticky = await this.stickyLogic.find(communityId, channelId);
		if (sticky !== undefined) {
			await interaction.reply(
				"スティッキーが既にチャンネルに登録されているよ！っ",
			);
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

		const modal = new ModalBuilder()
			.setCustomId("stickyModal")
			.setTitle("スティッキーの登録");
		const textInput = new TextInputBuilder()
			.setCustomId("stickyInput")
			.setLabel("スティッキーの文章")
			.setStyle(TextInputStyle.Paragraph);
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
				const message = await channel.send(modalInputText);
				if (!message) {
					await t.reply("スティッキーの投稿に失敗したよ！っ");
					return;
				}

				await t.reply(
					await this.stickyLogic.create(
						new StickyDto(
							communityId,
							channelId,
							userId,
							new DiscordMessageId(message.id),
							new StickyMessage(message.content),
						),
					),
				);
			})
			.catch(console.error);
	}
}
