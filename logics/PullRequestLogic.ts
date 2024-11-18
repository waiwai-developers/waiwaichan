import { AccountsConfig } from "@/entities/config/AccountsConfig";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import { GitHubUserId } from "@/entities/vo/GitHubUserId";
import type { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";
import type { IPullRequestLogic } from "@/logics/Interfaces/logics/IPullRequestLogic";
import type { IPullRequestRepository } from "@/logics/Interfaces/repositories/githubapi/IPullRequestRepository";

export class PullRequestLogic implements IPullRequestLogic {
	constructor(private readonly pullRequestRepository: IPullRequestRepository) {}

	async randomAssign(
		pullRequestId: GithubPullRequestId,
		userId: DiscordUserId,
	): Promise<string> {
		const pr = await this.pullRequestRepository.getById(pullRequestId);
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
		const randomNum = Math.floor(Math.random() * AccountsConfig.users.length);

		// NOTE:todo そのうち複数人に対応できるロジックに変える

		const selectReviewers = [AccountsConfig.users[randomNum]];
		await this.pullRequestRepository.assignReviewer(
			new GitHubUserId(selectReviewers[0].githubId),
			pullRequestId,
		);

		const pullRequestTitle = pr.title;
		const pullRequestUrl = pr.url;

		const texts = [
			selectReviewers.map((r) => `<@${r.discordId}>`).join(" "),
			"review依頼が来たよ！っ",
			"",
			`${pullRequestTitle}`,
			`pullreq: <${pullRequestUrl}>`,
		];
		return texts.join("\n");
	}

	async findAssignedPullRequest(userId: DiscordUserId): Promise<string> {
		const reviewerGithubId = AccountsConfig.users.find(
			(u) => u.discordId === userId.toString(),
		)?.githubId;
		if (!reviewerGithubId) {
			return "Githubのユーザー情報が紐づいてないよ！っ";
		}
		const list = await this.pullRequestRepository.getAssigneeList(userId);
		if (!list || list.length <= 0) {
			return "アイテムは持ってないよ！っ";
		}
		return [
			"以下のpull reqのreviewerにアサインされているよ！っ",
			...list.flatMap((dto) => {
				return [dto.title.getValue(), `pullreq: <${dto.url.getValue()}>`];
			}),
		].join("\n");
	}
}
