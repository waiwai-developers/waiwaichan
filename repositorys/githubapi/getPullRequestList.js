import { Octokit } from "@octokit/core";
import config from "../../config.json" with { type: "json" };

const octokit = new Octokit({
	auth: config.github.token,
});

export const getPullRequestList = async () => {
	try {
		const requests = await octokit.request(
			"GET /repos/{owner}/{repo}/pulls/{pull_number}",
			{
				owner: config.github.owner,
				repo: config.github.repo,
				state: "open",
				headers: {
					"X-GitHub-Api-Version": "2022-11-28",
				},
			},
		);
		return requests;
	} catch (e) {
		console.error("Error:", e);
	}
};
