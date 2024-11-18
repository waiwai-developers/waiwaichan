import type { GitHubUserId } from "@/entities/vo/GitHubUserId";
import type { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";
import type { GithubPullRequestTitle } from "@/entities/vo/GithubPullRequestTitle";
import type { GithubPullRequestUrl } from "@/entities/vo/GithubPullRequestUrl";
import type { GithubPullRequestStatus } from "@/entities/vo/GtihubPullRequestStatus";

export class PullRequestDto {
	constructor(
		public ownerId: GitHubUserId,
		public state: GithubPullRequestStatus,
		public prId: GithubPullRequestId,
		public title: GithubPullRequestTitle,
		public url: GithubPullRequestUrl,
	) {}
}
