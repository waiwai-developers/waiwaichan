import type { GitHubUserId } from "@/entities/vo/GitHubUserId";
import type { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";
import type { GithubPullRequestStatus } from "@/entities/vo/GtihubPullRequestStatus";

export class PullRequestDto {
	constructor(
		public ownerId: GitHubUserId,
		public state: GithubPullRequestStatus,
		public prId: GithubPullRequestId,
	) {}
}
