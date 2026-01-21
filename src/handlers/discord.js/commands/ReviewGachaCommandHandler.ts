import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadataGithub } from "@/src/entities/vo/ThreadMetadataGithub";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
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
				new CommunityClientId(BigInt(interaction.guildId))
			)
		)
		if (communityId == null) {
			return;
		}

		const message = await interaction.reply({
			content: await this.pullRequestLogic.randomAssign(
				new GithubPullRequestId(interaction.options?.getInteger("id", true)),
				new DiscordUserId(interaction.user.id),
			),
			fetchReply: true,
		});

		await this.threadLogic.create(
			new ThreadDto(
				communityId,
				new ThreadMessageId(message.id),
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
