import { ValueObject } from "./ValueObject";

export class GithubPullRequestStatus extends ValueObject<boolean> {
	static OPEN = new GithubPullRequestStatus(true);
	static CLOSED = new GithubPullRequestStatus(false);
}
