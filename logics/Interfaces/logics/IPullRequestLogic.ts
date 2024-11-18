import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";

export interface IPullRequestLogic {
	randomAssign(
		PullRequestId: GithubPullRequestId,
		userId: DiscordUserId,
	): Promise<string>;
}
