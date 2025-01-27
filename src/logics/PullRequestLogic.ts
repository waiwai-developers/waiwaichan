import { AccountsConfig } from "@/src/entities/config/AccountsConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import {
	REVIEWER_LENGTH,
	REVIEW_GRADE_HIGH,
} from "@/src/entities/constants/review";
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
		const reviewers = AccountsConfig.users.filter(
			(u) => u.discordId !== userId.getValue(),
		);

		if (reviewers.length === 0) {
			return "reviewerが存在しないよ！っ";
		}
		if (reviewers.filter((u) => u.grade === REVIEW_GRADE_HIGH).length === 0) {
			return "親reviewerが存在しないよ！っ";
		}

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

		if (REVIEWER_LENGTH <= 0) {
			return "reviewerの選ばれる人数が0以下に設定されているよ！っ";
		}

		if (REVIEWER_LENGTH > reviewers.length) {
			return "reviewerの選ばれる人数が実際のreviewerの数より多いよ！っ";
		}

		let selectReviewers: typeof AccountsConfig.users = [];

		do {
			for (let i = reviewers.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[reviewers[i], reviewers[j]] = [reviewers[j], reviewers[i]];
			}
			selectReviewers = reviewers.slice(0, REVIEWER_LENGTH);
		} while (
			!selectReviewers.some((s) => s.grade === REVIEW_GRADE_HIGH)
		);

		selectReviewers.forEach(
			async (r) =>
				await this.pullRequestRepository.assignReviewer(
					new GitHubUserId(r.githubId),
					pullRequestId,
				),
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
