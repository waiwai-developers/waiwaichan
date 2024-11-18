import { AppConfig } from "@/entities/config/AppConfig";
import { PullRequestDto } from "@/entities/dto/PullRequestDto";
import { GitHubUserId } from "@/entities/vo/GitHubUserId";
import { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";
import { GithubPullRequestStatus } from "@/entities/vo/GtihubPullRequestStatus";
import type { IPullRequestRepository } from "@/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import { Octokit } from "@octokit/core";

export class PullRequestRepositoryImpl implements IPullRequestRepository {
	private octokit: Octokit;
	constructor() {
		this.octokit = new Octokit({
			auth: AppConfig.github.token,
		});
	}

	async getById(pr: GithubPullRequestId): Promise<PullRequestDto | undefined> {
		return this.octokit
			.request("GET /repos/{owner}/{repo}/pulls/{pull_number}", {
				owner: AppConfig.github.owner,
				repo: AppConfig.github.repo,
				pull_number: pr.getValue(),
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			})
			.then((r) =>
				this.toDto(r.data.user.login, r.data.state === "open", r.data.id),
			);
	}

	toDto(ownerId: string, state: boolean, prId: number): PullRequestDto {
		return new PullRequestDto(
			new GitHubUserId(ownerId),
			new GithubPullRequestStatus(state),
			new GithubPullRequestId(prId),
		);
	}

	async assignReviewer(
		user: GitHubUserId,
		pr: GithubPullRequestId,
	): Promise<PullRequestDto | undefined> {
		return this.octokit
			.request(
				"POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
				{
					owner: AppConfig.github.owner,
					repo: AppConfig.github.repo,
					state: "open",
					pull_number: pr.getValue(),
					reviewers: [user.getValue()],
					team_reviewers: [],
					headers: {
						"X-GitHub-Api-Version": "2022-11-28",
					},
				},
			)
			.then((r) =>
				this.toDto(
					r.data.user?.login ? r.data.user.login : "",
					r.data.state === "open",
					r.data.id,
				),
			);
	}
}
