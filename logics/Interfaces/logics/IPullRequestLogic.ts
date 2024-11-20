import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";

export interface IPullRequestLogic {
	randomAssign(
		pullRequestId: GithubPullRequestId,
		userId: DiscordUserId,
	): Promise<string>;
	findAssignedPullRequest(userId: DiscordUserId): Promise<string>;
}
