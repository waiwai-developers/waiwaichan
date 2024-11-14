import { Octokit } from "@octokit/core";
import config from "../../config.json" with { type: "json" };

const octokit = new Octokit({
	auth: config.github.token,
});

export const getPullRequest = async (pullReqId) => {
	try {
		const request = await octokit.request(
			"GET /repos/{owner}/{repo}/pulls/{pull_number}",
			{
				owner: config.github.owner,
				repo: config.github.repo,
				pull_number: pullReqId,
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
