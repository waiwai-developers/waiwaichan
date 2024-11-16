import type { PullRequestDto } from "@/entities/dto/PullRequestDto";
import type { GitHubUserId } from "@/entities/vo/GitHubUserId";
import type { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";

export interface IPullRequestRepository {
	getById(pr: GithubPullRequestId): Promise<PullRequestDto | undefined>;
	assignReviewer(
		user: GitHubUserId,
		pr: GithubPullRequestId,
	): Promise<PullRequestDto | undefined>;
}
