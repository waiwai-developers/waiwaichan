import { appContainer } from "@/src/app.di.config";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IPullRequestRepository } from "@/src/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import { mockSlashCommand, waitUntilReply, createMockMessage } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { MockGithubAPI, MockNotfoundGithubAPI } from "@/tests/fixtures/repositories/MockGithubAPI";
import { expect } from "chai";
import type { Message, Client, ChatInputCommandInteraction } from "discord.js";
import { anything, instance, when, verify } from "ts-mockito";

// テスト用のguildId（MockSlashCommandで使用される値と一致させる）
export const TEST_GUILD_ID = "9999";

/**
 * 型定義
 */

/** ReviewGachaコマンドのオプション型 */
export interface ReviewGachaCommandOptions {
	id: number | null;
}

/** ReviewListコマンドのオプション型（オプションなし） */
export type ReviewListCommandOptions = Record<string, never>;

/** ユーザー設定型 */
export interface UserConfig {
	userId: string;
	withChannel: boolean;
}

/** コマンドセットアップの結果型 */
export interface CommandSetupResult<TOptions> {
	client: Client;
	commandMock: ChatInputCommandInteraction;
	messageMock?: Message;
}

/** メッセージを含むコマンドセットアップの結果型 */
export type CommandSetupResultWithMessage<TOptions> = Required<CommandSetupResult<TOptions>>;

/**
 * 汎用的なコマンドハンドラーのセットアップ
 */
export async function setupCommandHandler<TOptions>(
	commandName: string,
	options: TOptions,
	userId: string | UserConfig,
): Promise<CommandSetupResult<TOptions>> {
	const client = await TestDiscordServer.getClient();
	const commandMock = mockSlashCommand(commandName, options, userId);
	
	return { client, commandMock };
}

/**
 * メッセージモック付きのコマンドハンドラーセットアップ
 */
export async function setupCommandHandlerWithMessage<TOptions>(
	commandName: string,
	options: TOptions,
	userConfig: UserConfig,
): Promise<CommandSetupResultWithMessage<TOptions>> {
	const client = await TestDiscordServer.getClient();
	const { message } = createMockMessage();
	const commandMock = mockSlashCommand(commandName, options, userConfig);
	
	return { client, commandMock, messageMock: message };
}

/**
 * イベント登録テストのヘルパー関数
 */

/**
 * interactionCreateイベントを発行し、応答を待つ
 */
export async function emitInteractionAndWait(
	client: Client,
	commandMock: ChatInputCommandInteraction,
): Promise<void> {
	client.emit("interactionCreate", instance(commandMock));
	await waitUntilReply(commandMock);
}

/**
 * replyが呼ばれないことを検証する
 */
export function verifyReplyNeverCalled(commandMock: ChatInputCommandInteraction): void {
	verify(commandMock.reply(anything())).never();
}

/**
 * editReplyが呼ばれないことを検証する
 */
export function verifyEditReplyNeverCalled(commandMock: ChatInputCommandInteraction): void {
	verify(commandMock.editReply(anything())).never();
}

/**
 * deferReplyが1回呼ばれることを検証する
 */
export function verifyDeferReplyCalled(commandMock: ChatInputCommandInteraction): void {
	verify(commandMock.deferReply()).once();
}

/**
 * editReplyが1回呼ばれることを検証する
 */
export function verifyEditReplyCalled(commandMock: ChatInputCommandInteraction): void {
	verify(commandMock.editReply(anything())).once();
}

/**
 * reviewgachaコマンドのモックを作成し、実行する
 */
export async function setupReviewGachaCommand(
	options: ReviewGachaCommandOptions,
	userConfig: UserConfig,
): Promise<CommandSetupResultWithMessage<ReviewGachaCommandOptions>> {
	return setupCommandHandlerWithMessage("reviewgacha", options, userConfig);
}

/**
 * reviewlistコマンドのモックを作成し、実行する
 */
export async function setupReviewListCommand(userId: string): Promise<CommandSetupResult<ReviewListCommandOptions>> {
	return setupCommandHandler<ReviewListCommandOptions>("reviewlist", {}, userId);
}

/**
 * コマンドを実行し、replyの結果を取得する
 */
export async function executeCommandAndCaptureReply(
	client: Client,
	commandMock: ChatInputCommandInteraction,
	message?: Message,
): Promise<string> {
	let result = "";
	if (message) {
		when(commandMock.reply(anything())).thenCall((args) => {
			result = args.content;
			return Promise.resolve(message);
		});
	} else {
		when(commandMock.reply(anything())).thenCall((args) => {
			result = args;
			return Promise.resolve();
		});
	}

	client.emit("interactionCreate", instance(commandMock));
	await waitUntilReply(commandMock);
	return result;
}

/**
 * コマンドを実行し、editReplyの結果を取得する
 */
export async function executeCommandAndCaptureEditReply(
	client: Client,
	commandMock: ChatInputCommandInteraction,
): Promise<string> {
	let result = "";
	when(commandMock.editReply(anything())).thenCall((args) => {
		result = args;
	});

	client.emit("interactionCreate", instance(commandMock));
	await waitUntilReply(commandMock);
	return result;
}

/**
 * Repositoryテストのヘルパー関数
 */

/**
 * PullRequestRepositoryのモックを設定する
 */
export function setupPullRequestRepositoryMock(mockRepo: IPullRequestRepository): void {
	appContainer.rebind<IPullRequestRepository>(RepoTypes.PullRequestRepository).toConstantValue(mockRepo);
}

/**
 * Repository操作の共通エラーシナリオ
 */
export enum RepositoryErrorScenario {
	NotFound = "NotFound",
	Success = "Success",
}

/**
 * エラーシナリオに応じたRepositoryモックをセットアップ
 */
export function setupRepositoryScenario(scenario: RepositoryErrorScenario): void {
	switch (scenario) {
		case RepositoryErrorScenario.NotFound:
			setupPullRequestRepositoryMock(MockNotfoundGithubAPI());
			break;
		case RepositoryErrorScenario.Success:
			setupPullRequestRepositoryMock(MockGithubAPI());
			break;
	}
}

/**
 * Repositoryエラーシナリオでコマンドを実行し、replyを検証
 */
export async function executeCommandWithRepositoryScenario<TOptions>(
	scenario: RepositoryErrorScenario,
	commandName: string,
	options: TOptions,
	userConfig: UserConfig,
	expectedError: string,
): Promise<void> {
	setupRepositoryScenario(scenario);
	
	const { client, commandMock, messageMock } = await setupCommandHandlerWithMessage(
		commandName,
		options,
		userConfig,
	);

	const result = await executeCommandAndCaptureReply(client, commandMock, messageMock);

	expect(result).to.eq(expectedError);
}

/**
 * Repositoryエラーシナリオでコマンドを実行し、editReplyを検証
 */
export async function executeCommandWithRepositoryScenarioEditReply<TOptions>(
	scenario: RepositoryErrorScenario,
	commandName: string,
	options: TOptions,
	userId: string,
	expectedError: string,
): Promise<void> {
	setupRepositoryScenario(scenario);
	
	const { client, commandMock } = await setupCommandHandler(commandName, options, userId);

	const result = await executeCommandAndCaptureEditReply(client, commandMock);

	expect(result).to.eq(expectedError);
}

/**
 * PR存在チェックのテストヘルパー
 * NotFoundシナリオでコマンドを実行し、エラーメッセージを検証
 */
export async function testPRNotFound<TOptions>(
	commandName: string,
	options: TOptions,
	userConfig: UserConfig,
): Promise<void> {
	await executeCommandWithRepositoryScenario(
		RepositoryErrorScenario.NotFound,
		commandName,
		options,
		userConfig,
		"pull requestが存在しないよ！っ",
	);
}

/**
 * アサインされているPRがないケースのテストヘルパー
 * NotFoundシナリオでコマンドを実行し、editReplyでエラーメッセージを検証
 */
export async function testNoPRsAssigned<TOptions>(
	commandName: string,
	options: TOptions,
	userId: string,
): Promise<void> {
	await executeCommandWithRepositoryScenarioEditReply(
		RepositoryErrorScenario.NotFound,
		commandName,
		options,
		userId,
		"アサインされているpull reqはないよ！っ",
	);
}
