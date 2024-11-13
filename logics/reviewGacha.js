import accounts from "../config/accounts.json" with { type: "json" };
import { getPullRequest } from "../repositorys/githubapi/getPullRequest.mjs";
import { reviewPullRequest } from "../repositorys/githubapi/reviewPullRequest.mjs";

export const reviewGacha = async (discordId, pullReqId) => {
	try {
		const reviewerDiscordIds = accounts
			.filter((a) => a.user.discordId !== discordId)
			.map((a) => a.user.discordId);
		const reviewerGithubIds = accounts
			.filter((a) => a.user.discordId !== discordId)
			.map((a) => a.user.githubId);

		const response = await getPullRequest(pullReqId);
		const pullRequest = response.data

		if (
			pullRequest.user.id !==
			accounts.find((a) => a.user.githubId === pullRequest.user.id)
		) {
			return "pull reqのオーナーじゃないよ！っ";
		}

		await reviewPullRequest(reviewerGithubIds, pullReqId);

		if (pullRequest.state !== "open") {
			return "pull reqのステータスがopenじゃないよ！っ";
		}

		const pullRequestTitle = pullRequest.title;
		const pullRequestUrl = pullRequest.url;
		const issueUrl = pullRequest.issue_url;

		const texts = [];
		texts.push(reviewerDiscordIds.map((r) => `<@${r}>`).join(" "));
		texts.push(
			`\n\n${pullRequestTitle}\n- issue: ${pullRequestUrl}\n- pullreq: ${issueUrl}`,
		);

		return texts.join("\n");
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
