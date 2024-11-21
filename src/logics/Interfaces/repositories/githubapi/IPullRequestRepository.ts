import type { PullRequestDto } from "@/src/entities/dto/PullRequestDto";
import type { GitHubUserId } from "@/src/entities/vo/GitHubUserId";
import type { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";

export interface IPullRequestRepository {
	getById(pr: GithubPullRequestId): Promise<PullRequestDto | undefined>;
	assignReviewer(
		user: GitHubUserId,
		pr: GithubPullRequestId,
	): Promise<PullRequestDto | undefined>;
	getAssigneeList(user: GitHubUserId): Promise<PullRequestDto[]>;
}
