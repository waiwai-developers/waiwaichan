import type { GitHubUserId } from "@/src/entities/vo/GitHubUserId";
import type { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";
import type { GithubPullRequestTitle } from "@/src/entities/vo/GithubPullRequestTitle";
import type { GithubPullRequestUrl } from "@/src/entities/vo/GithubPullRequestUrl";
import type { GithubPullRequestStatus } from "@/src/entities/vo/GtihubPullRequestStatus";

export class PullRequestDto {
	constructor(
		public ownerId: GitHubUserId,
		public state: GithubPullRequestStatus,
		public prId: GithubPullRequestId,
		public title: GithubPullRequestTitle,
		public url: GithubPullRequestUrl,
	) {}
}
