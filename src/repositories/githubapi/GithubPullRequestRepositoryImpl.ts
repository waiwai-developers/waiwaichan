import * as fs from "node:fs";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { PullRequestDto } from "@/src/entities/dto/PullRequestDto";
import { GitHubUserId } from "@/src/entities/vo/GitHubUserId";
import { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";
import { GithubPullRequestTitle } from "@/src/entities/vo/GithubPullRequestTitle";
import { GithubPullRequestUrl } from "@/src/entities/vo/GithubPullRequestUrl";
import { GithubPullRequestStatus } from "@/src/entities/vo/GtihubPullRequestStatus";
import type { IPullRequestRepository } from "@/src/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import { App } from "@octokit/app";
import { Octokit } from "@octokit/core";
import { injectable, postConstruct } from "inversify";

@injectable()
export class GithubPullRequestRepositoryImpl implements IPullRequestRepository {
	private octokit: Octokit | undefined;

	private isApp() {
		return (
			AppConfig.github.appId != null &&
			AppConfig.github.appId.length !== 0 &&
			AppConfig.github.privateKey != null &&
			AppConfig.github.privateKey.length !== 0 &&
			fs.existsSync(AppConfig.github.privateKey) &&
			AppConfig.github.installationId != null &&
			AppConfig.github.installationId.length !== 0 &&
			!Number.isNaN(Number.parseInt(AppConfig.github.installationId))
		);
	}

	@postConstruct()
	public async initialize() {
		console.log(`Initializing Github Pull Request App Mode:${this.isApp()}`);

		this.octokit = this.isApp()
			? await new App({
					appId: String(AppConfig.github.appId),
					privateKey: fs.readFileSync(
						String(AppConfig.github.privateKey),
						"utf8",
					),
				}).getInstallationOctokit(Number(AppConfig.github.installationId))
			: new Octokit({
					auth: AppConfig.github.token,
				});
	}

	async getById(pr: GithubPullRequestId): Promise<PullRequestDto | undefined> {
		if (!this.octokit) {
			throw new Error("Github API not initialized");
		}
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
				this.toDto(
					r.data.user.login,
					r.data.state === "open",
					r.data.id,
					r.data.title,
					r.data.html_url,
				),
			);
	}

	async assignReviewer(
		user: GitHubUserId,
		pr: GithubPullRequestId,
	): Promise<PullRequestDto | undefined> {
		if (!this.octokit) {
			throw new Error("Github API not initialized");
		}

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
					r.data.title,
					r.data.html_url,
				),
			);
	}

	async getAssigneeList(user: GitHubUserId): Promise<PullRequestDto[]> {
		if (!this.octokit) {
			throw new Error("Github API not initialized");
		}

		return this.octokit
			.request("GET /repos/{owner}/{repo}/pulls", {
				owner: AppConfig.github.owner,
				repo: AppConfig.github.repo,
				state: "open",
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			})
			.then((res) => {
				return res.data
					.filter((p) =>
						p.requested_reviewers?.some((r) => r.login === user.getValue()),
					)
					.map((r) =>
						this.toDto(
							r.user?.login ? r.user.login : "",
							r.state === "open",
							r.id,
							r.title,
							r.html_url,
						),
					);
			});
	}

	toDto(
		ownerId: string,
		state: boolean,
		prId: number,
		title: string,
		url: string,
	): PullRequestDto {
		return new PullRequestDto(
			new GitHubUserId(ownerId),
			new GithubPullRequestStatus(state),
			new GithubPullRequestId(prId),
			new GithubPullRequestTitle(title),
			new GithubPullRequestUrl(url),
		);
	}
}
