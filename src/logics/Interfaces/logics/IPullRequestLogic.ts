import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";

export interface IPullRequestLogic {
	randomAssign(
		pullRequestId: GithubPullRequestId,
		userId: DiscordUserId,
	): Promise<string>;
	findAssignedPullRequest(userId: DiscordUserId): Promise<string>;
}
