import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";
import type { IPullRequestLogic } from "@/logics/Interfaces/logics/IPullRequestLogic";
import type { IPullRequestRepository } from "@/logics/Interfaces/repositories/githubapi/IPullRequestRepository";

export class PullRequestLogic implements IPullRequestLogic {
	constructor(private readonly pullRequestRepository: IPullRequestRepository) {}

	randomAssign(
		PullRequestId: GithubPullRequestId,
		userId: DiscordUserId,
	): Promise<string> {
		throw new Error("Method not implemented.");
	}
}
