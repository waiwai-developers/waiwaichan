import { AccountsConfig } from "@/src/entities/config/AccountsConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { GitHubUserId } from "@/src/entities/vo/GitHubUserId";
import type { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { IPullRequestRepository } from "@/src/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import { inject, injectable } from "inversify";

@injectable()
export class PullRequestLogic implements IPullRequestLogic {
	@inject(RepoTypes.PullRequestRepository)
	private readonly pullRequestRepository!: IPullRequestRepository;

	async randomAssign(
		pullRequestId: GithubPullRequestId,
		userId: DiscordUserId,
	): Promise<string> {

		const reviewers = AccountsConfig.users
			.filter((u) => u.discordId !== userId.getValue());

		const pr = await this.pullRequestRepository.getById(pullRequestId);

		// NOTE:todo 機能していないのでerror responseに応じて直す必要がある
		if (pr == null) {
			return "pull requestが存在しないよ！っ";
		}
		if (
			pr.ownerId.getValue() !==
			AccountsConfig.users.find((u) => u.discordId === userId.getValue())
				?.githubId
		) {
			return "pull reqのオーナーじゃないよ！っ";
		}

		if (!pr.state.getValue()) {
			return "pull reqのステータスがopenじゃないよ！っ";
		}

		// NOTE:todo より良い乱数生成に変える
		const randomNum = Math.floor(Math.random() * reviewers.length);

		// NOTE:todo そのうち複数人に対応できるロジックに変える
		const selectReviewers = [reviewers[randomNum]];

		await this.pullRequestRepository.assignReviewer(
			new GitHubUserId(selectReviewers[0].githubId),
			pullRequestId,
		);

		const texts = [
			selectReviewers.map((r) => `<@${r.discordId}>`).join(" "),
			"review依頼が来たよ！っ",
			"",
			`${pr.title.getValue()}`,
			`pullreq: <${pr.url.getValue()}>`,
		];
		return texts.join("\n");
	}

	async findAssignedPullRequest(userId: DiscordUserId): Promise<string> {
		const reviewerGithubId = AccountsConfig.users.find(
			(u) => u.discordId === userId.getValue(),
		)?.githubId;
		if (!reviewerGithubId) {
			return "Githubのユーザー情報が紐づいてないよ！っ";
		}
		const list = await this.pullRequestRepository.getAssigneeList(
			new GitHubUserId(reviewerGithubId),
		);
		if (list.length <= 0) {
			return "アサインされているpull reqはないよ！っ";
		}
		return [
			"以下のpull reqのreviewerにアサインされているよ！っ\n",
			...list.flatMap((dto) => {
				return [dto.title.getValue(), `pullreq: <${dto.url.getValue()}>`];
			}),
		].join("\n");
	}
}
