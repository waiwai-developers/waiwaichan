import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "./SlashCommandHandler";

@injectable()
class ReviewGachaCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.PullRequestLogic)
	private pullRequestLogic!: IPullRequestLogic;

	isHandle(commandName: string): boolean {
		return commandName === "reviewgacha";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.deferReply();
		await interaction.editReply(
			await this.pullRequestLogic.randomAssign(
				new GithubPullRequestId(interaction.options?.getInteger("id") ?? 0),
				new DiscordUserId(interaction.user.id),
			),
		);
	}
}

@injectable()
class ReviewListCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.PullRequestLogic)
	private pullRequestLogic!: IPullRequestLogic;

	isHandle(commandName: string): boolean {
		return commandName === "reviewlist";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.deferReply();
		await interaction.editReply(
			await this.pullRequestLogic.findAssignedPullRequest(
				new DiscordUserId(interaction.user.id),
			),
		);
	}
}
