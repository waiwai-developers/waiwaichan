import accounts from "../config/accounts.json" with { type: "json" };
import { getPullRequestList } from "../repositorys/githubapi/getPullRequestList.js";

export const reviewList = async (discordId) => {
	try {
		const reviewerGithubId = accounts.find(
			(a) => a.user.discordId === discordId,
		).user.githubId;
		const response = await getPullRequestList();

		const pullRequests = response.data;

		const filterPullRequests = pullRequests.filter((p) =>
			p.requested_reviewers.some((r) => r.login === reviewerGithubId),
		);

		if (filterPullRequests.length === 0) return "openなpull reqはないよ！っ";

		const texts = [];
		texts.push("以下のpull reqのreviewerにアサインされているよ！っ\n");
		filterPullRequests.forEach((f) =>
			texts.push([`${f.title}`, `pullreq: <${f.html_url}>`].join("\n")),
		);

		return texts.join("\n");
	} catch (e) {
		console.error("Error:", e);
		return "エラーが起こったよ！っ";
	}
};
