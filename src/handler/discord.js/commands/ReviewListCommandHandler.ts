import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { SlashCommandHandler } from "@/src/handler/discord.js/commands/SlashCommandHandler";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ReviewListCommandHandler implements SlashCommandHandler {
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
