import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { MessageDto } from "@/src/entities/dto/MessageDto";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";
import { MessageCategoryType } from "@/src/entities/vo/MessageCategoryType";
import { MessageChannelId } from "@/src/entities/vo/MessageChannelId";
import { MessageClientId } from "@/src/entities/vo/MessageClientId";
import { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import { MessageUserId } from "@/src/entities/vo/MessageUserId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadataGithub } from "@/src/entities/vo/ThreadMetadataGithub";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type {
	CacheType,
	ChatInputCommandInteraction,
	TextChannel,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ReviewGachaCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.PullRequestLogic)
	private pullRequestLogic!: IPullRequestLogic;
	@inject(LogicTypes.ThreadLogic)
	private readonly threadLogic!: IThreadLogic;
	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;
	@inject(LogicTypes.UserLogic)
	private UserLogic!: IUserLogic;
	@inject(LogicTypes.ChannelLogic)
	private ChannelLogic!: IChannelLogic;
	@inject(LogicTypes.MessageLogic)
	private MessageLogic!: IMessageLogic;

	isHandle(commandName: string): boolean {
		return commandName === "reviewgacha";
	}

	isTextChannel(channel: unknown): channel is TextChannel {
		return (
			(channel as TextChannel).threads != null &&
			(channel as TextChannel).threads.create != null
		);
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (interaction.channel == null) {
			return;
		}
		if (!this.isTextChannel(interaction.channel)) {
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
			await interaction.reply("コミュニティが登録されていなかったよ！っ");
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
			await interaction.reply("ユーザーが登録されていなかったよ！っ");
			return;
		}

		const channelId = await this.ChannelLogic.getIdByCommunityIdAndClientId(
			new ChannelCommunityId(communityId.getValue()),
			new ChannelClientId(BigInt(interaction.channelId)),
		);
		if (channelId == null) {
			await interaction.reply("チャンネルが登録されていなかったよ！っ");
			return;
		}

		const message = await interaction.reply({
			content: await this.pullRequestLogic.randomAssign(
				new GithubPullRequestId(interaction.options?.getInteger("id", true)),
				new DiscordUserId(interaction.user.id),
			),
			fetchReply: true,
		});

		const messageId = await this.MessageLogic.findOrCreate(
			new MessageDto(
				MessageCategoryType.Discord,
				new MessageClientId(BigInt(message.id)),
				new MessageCommunityId(communityId.getValue()),
				new MessageUserId(userId.getValue()),
				new MessageChannelId(channelId.getValue()),
			),
		);

		await this.threadLogic.create(
			new ThreadDto(
				communityId,
				new ThreadMessageId(messageId.getValue()),
				ThreadCategoryType.CATEGORY_TYPE_GITHUB,
				new ThreadMetadataGithub(JSON.parse("{}")),
			),
		);

		await message.startThread({
			name: `#${interaction.options?.getInteger("id", true)}のpull reqのレビュー依頼`,
			autoArchiveDuration: 60,
		});
	}
}
