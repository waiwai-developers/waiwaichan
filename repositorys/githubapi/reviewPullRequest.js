import { Octokit } from "@octokit/core";
import config from "../../config.json" with { type: "json" };

const octokit = new Octokit({
	auth: config.github.token,
});

export const reviewPullRequest = async (reviewerGithubIds, pullReqId) => {
	try {
		const request = await octokit.request(
			"POST /repos/{owner}/{repo}/pulls/{pull_number}/requested_reviewers",
			{
				owner: config.github.owner,
				repo: config.github.repo,
				state: "open",
				pull_number: pullReqId,
				reviewers: reviewerGithubIds,
				team_reviewers: [],
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			},
		);
		return request;
	} catch (e) {
		console.error("Error:", e);
	}
};
