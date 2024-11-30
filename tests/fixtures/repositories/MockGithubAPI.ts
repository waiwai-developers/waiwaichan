import { AccountsConfig } from "@/src/entities/config/AccountsConfig";
import { PullRequestDto } from "@/src/entities/dto/PullRequestDto";
import { GitHubUserId } from "@/src/entities/vo/GitHubUserId";
import { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";
import { GithubPullRequestTitle } from "@/src/entities/vo/GithubPullRequestTitle";
import { GithubPullRequestUrl } from "@/src/entities/vo/GithubPullRequestUrl";
import { GithubPullRequestStatus } from "@/src/entities/vo/GtihubPullRequestStatus";
import type { IPullRequestRepository } from "@/src/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import { anything, instance, mock, when } from "ts-mockito";

export const DummyPullRequest = new PullRequestDto(
	new GitHubUserId(AccountsConfig.users[0].githubId),
	GithubPullRequestStatus.OPEN,
	new GithubPullRequestId(1),
	new GithubPullRequestTitle("title"),
	new GithubPullRequestUrl("https://example.com"),
);

export const MockGithubAPI = () => {
	const mockedRepo = mock<IPullRequestRepository>();
	// https://github.com/NagRock/ts-mockito/issues/222
	when((mockedRepo as any).then).thenReturn(undefined);
	when(mockedRepo.getById(anything())).thenResolve(DummyPullRequest);
	when(mockedRepo.assignReviewer(anything(), anything())).thenResolve(DummyPullRequest);
	when(mockedRepo.getAssigneeList(anything())).thenResolve([DummyPullRequest]);
	return instance(mockedRepo);
};

export const MockNotfoundGithubAPI = () => {
	const mockedRepo = mock<IPullRequestRepository>();
	// https://github.com/NagRock/ts-mockito/issues/222
	when((mockedRepo as any).then).thenReturn(undefined);
	when(mockedRepo.getById(anything())).thenResolve(undefined);
	when(mockedRepo.assignReviewer(anything(), anything())).thenResolve(undefined);
	when(mockedRepo.getAssigneeList(anything())).thenResolve([]);
	return instance(mockedRepo);
};

export const MockFailGithubAPI = () => {
	const mockedRepo = mock<IPullRequestRepository>();
	// https://github.com/NagRock/ts-mockito/issues/222
	when((mockedRepo as any).then).thenReturn(undefined);
	when(mockedRepo.getById(anything())).thenThrow(new Error("getById Error"));
	when(mockedRepo.assignReviewer(anything(), anything())).thenThrow(new Error("assignReview Error"));
	when(mockedRepo.getAssigneeList(anything())).thenThrow(new Error("getAssignee Error"));
	return instance(mockedRepo);
};
