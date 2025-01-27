import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadata } from "@/src/entities/vo/ThreadMetadata";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
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

		const message = await interaction.reply({
			content: await this.pullRequestLogic.randomAssign(
				new GithubPullRequestId(interaction.options?.getInteger("id", true)),
				new DiscordUserId(interaction.user.id),
			),
			fetchReply: true,
		});

		await this.threadLogic.create(
			new ThreadDto(
				new ThreadGuildId(message.guildId),
				new ThreadMessageId(message.id),
				ThreadCategoryType.CATEGORY_TYPE_GITHUB,
				new ThreadMetadata(JSON.parse("{}")),
			),
		);

		await message.startThread({
			name: `#${interaction.options?.getInteger("id", true)}のpull reqのレビュー依頼`,
			autoArchiveDuration: 60,
		});
	}
}
