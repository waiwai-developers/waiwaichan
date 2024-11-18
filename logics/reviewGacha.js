import accounts from "../config/accounts.json" with { type: "json" };
import { getPullRequest } from "../repositorys/githubapi/getPullRequest.js";
import { reviewPullRequest } from "../repositorys/githubapi/reviewPullRequest.js";

export const reviewGacha = async (discordId, pullReqId) => {
	try {
		const reviewerDiscordIds = accounts.users
			.filter((u) => u.discordId !== discordId)
			.map((u) => u.discordId);
		const reviewerGithubIds = accounts.users
			.filter((u) => u.discordId !== discordId)
			.map((u) => u.githubId);

		const response = await getPullRequest(pullReqId);
		const pullRequest = response.data;

		if (
			pullRequest.user.login !==
			accounts.users.find((u) => u.discordId === discordId).githubId
		) {
			return "pull reqのオーナーじゃないよ！っ";
		}

		if (pullRequest.state !== "open") {
			return "pull reqのステータスがopenじゃないよ！っ";
		}

		// NOTE:todo より良い乱数生成に変える
		const randomNum = Math.floor(Math.random() * reviewerGithubIds.length);

		// NOTE:todo そのうち複数人に対応できるロジックに変える
		const selectReviewerGithubIds = [reviewerGithubIds[randomNum]];
		const selectReviewerDiscordIds = [reviewerDiscordIds[randomNum]];

		await reviewPullRequest(selectReviewerGithubIds, pullReqId);

		const pullRequestTitle = pullRequest.title;
		const pullRequestUrl = pullRequest.html_url;

		const texts = [];
		texts.push(selectReviewerDiscordIds.map((r) => `<@${r}>`).join(" "));
		texts.push("review依頼が来たよ！っ");
		texts.push(`\n${pullRequestTitle}\npullreq: <${pullRequestUrl}>`);

		return texts.join("\n");
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
