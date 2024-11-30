import { clearInterval } from "node:timers";
import { appContainer } from "@/src/app.di.config";
import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { AccountsConfig } from "@/src/entities/config/AccountsConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ReminderNotifyHandler } from "@/src/handlers/discord.js/events/ReminderNotifyHandler";
import type { IVirtualMachineAPI } from "@/src/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";
import type { IPullRequestRepository } from "@/src/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import { ReminderRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { DummyPullRequest, MockGithubAPI, MockNotfoundGithubAPI } from "@/tests/fixtures/repositories/MockGithubAPI";
import { MockVirtualMachineAPI } from "@/tests/fixtures/repositories/MockVirtualMachineAPI";
import dayjs from "dayjs";
import { type Channel, type ChannelManager, ChannelResolvable, type Client, type Collection, type Snowflake, TextChannel } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Test Reminder Commands", () => {
	beforeEach(() => {
		appContainer.rebind<IPullRequestRepository>(RepoTypes.PullRequestRepository).toConstantValue(MockGithubAPI());
	});
	test("/reviewgacha", async () => {
		const TEST_CLIENT = await TestDiscordServer.getClient();
		// P = 1-(1-p)^n
		// → 0.9999(99.99%) = 1-(1-0.3333(33.33%))^n
		// → n = log(1-0.9999)/log(1-0.3333) ≒ 22.7128 ≒ 23
		for (let i = 0; i < 23; i++) {
			const commandMock = mockSlashCommand(
				"reviewgacha",
				{
					id: 1,
				},
				AccountsConfig.users[0].discordId,
			);

			let result = "";
			when(commandMock.editReply(anything())).thenCall((args) => {
				result = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.editReply(anything())).once();
			const correctResult = AccountsConfig.users
				.slice(1)
				.map((user) =>
					[
						`<@${user.discordId}>`,
						"review依頼が来たよ！っ",
						"",
						`${DummyPullRequest.title.getValue()}`,
						`pullreq: <${DummyPullRequest.url.getValue()}>`,
					].join("\n"),
				);

			expect(correctResult).toContain(result);
		}
	});

	test("/reviewgacha called not owner ", async () => {
		const TEST_CLIENT = await TestDiscordServer.getClient();
		const commandMock = mockSlashCommand(
			"reviewgacha",
			{
				id: 1,
			},
			AccountsConfig.users[1].discordId,
		);

		let result = "";
		when(commandMock.editReply(anything())).thenCall((args) => {
			result = args;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply(anything())).once();

		expect(result).toBe("pull reqのオーナーじゃないよ！っ");
	});

	test("/reviewgacha when id is null", async () => {
		const TEST_CLIENT = await TestDiscordServer.getClient();
		const commandMock = mockSlashCommand(
			"reviewgacha",
			{
				id: null,
			},
			AccountsConfig.users[0].discordId,
		);

		let result = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			result = args;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply(anything())).never();

		expect(result).toBe(InternalErrorMessage);
	});

	test("/reviewlist", async () => {
		const TEST_CLIENT = await TestDiscordServer.getClient();
		const commandMock = mockSlashCommand("reviewlist", {}, AccountsConfig.users[0].discordId);

		let result = "";
		when(commandMock.editReply(anything())).thenCall((args) => {
			result = args;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply(anything())).once();

		expect(result).toBe(
			[
				"以下のpull reqのreviewerにアサインされているよ！っ",
				"",
				`${DummyPullRequest.title.getValue()}`,
				`pullreq: <${DummyPullRequest.url.getValue()}>`,
			].join("\n"),
		);
	});

	test("/reviewlist not assigned", async () => {
		appContainer.rebind<IPullRequestRepository>(RepoTypes.PullRequestRepository).toConstantValue(MockNotfoundGithubAPI());
		const TEST_CLIENT = await TestDiscordServer.getClient();
		const commandMock = mockSlashCommand("reviewlist", {}, AccountsConfig.users[0].discordId);

		let result = "";
		when(commandMock.editReply(anything())).thenCall((args) => {
			result = args;
		});

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.editReply(anything())).once();

		expect(result).toBe("アサインされているpull reqはないよ！っ");
	});
});
