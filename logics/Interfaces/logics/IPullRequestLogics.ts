import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";

interface IPullRequestLogics {
	randomAssign(
		PullRequestId: GithubPullRequestId,
		userId: DiscordUserId,
	): string;
}
