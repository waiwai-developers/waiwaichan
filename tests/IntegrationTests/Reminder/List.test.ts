import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { ChannelRepositoryImpl, CommunityRepositoryImpl, ReminderRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import { anything, instance, verify, when } from "ts-mockito";

// =============================================================================
// テスト用の定数
// =============================================================================
const TEST_GUILD_ID = "9999"; // communityのclientId（MockSlashCommandのデフォルト）
const TEST_USER_ID = "1234"; // userのclientId（MockSlashCommandのデフォルト）
const TEST_CHANNEL_CLIENT_ID = "5678"; // channelのclientId（MockSlashCommandのデフォルト）

const FUTURE_DATETIME = "2999/12/31 23:59:59";
const FUTURE_DATETIME_FORMATTED = "3000-01-01 08:59:59"; // UTC+9で表示

// =============================================================================
// ヘルパー関数
// =============================================================================

/**
 * スラッシュコマンドを実行してリプライを待機する
 */
async function executeCommand<T extends Record<string, unknown>>(commandName: string, options?: T): Promise<ReturnType<typeof mockSlashCommand>> {
	const commandMock = mockSlashCommand(commandName, options);
	const client = await TestDiscordServer.getClient();
	client.emit("interactionCreate", instance(commandMock));
	await waitUntilReply(commandMock);
	return commandMock;
}

/**
 * テスト用リマインダーデータを作成する
 */
function createReminderTestData(
	communityId: number,
	userId: number | string,
	channelId: number,
	overrides: Partial<{ receiveUserName: string; message: string; remindAt: string }> = {},
): Record<string, unknown> {
	return {
		communityId,
		userId,
		channelId,
		receiveUserName: "username",
		message: "test reminder",
		remindAt: FUTURE_DATETIME,
		...overrides,
	};
}

// =============================================================================
// テスト本体
// =============================================================================
describe("Test ReminderListCommandHandler", () => {
	let testCommunityId: number;
	let testUserId: number;
	let testChannelId: number;

	/**
	 * テスト実行前に毎回実行される共通のセットアップ
	 */
	beforeEach(async () => {
		new MysqlConnector();

		// 既存レコードのクリーンアップ
		await ReminderRepositoryImpl.destroy({ truncate: true, force: true });
		await ChannelRepositoryImpl.destroy({ truncate: true, force: true });
		await UserRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });

		// テスト用コミュニティ作成
		const community = await CommunityRepositoryImpl.create({
			categoryType: 0,
			clientId: BigInt(TEST_GUILD_ID),
			batchStatus: 0,
		});
		testCommunityId = community.id;

		// テスト用ユーザー作成
		const user = await UserRepositoryImpl.create({
			categoryType: 0,
			clientId: BigInt(TEST_USER_ID),
			userType: 0,
			communityId: community.id,
			batchStatus: 0,
		});
		testUserId = user.id;

		// テスト用チャンネル作成
		const channel = await ChannelRepositoryImpl.create({
			categoryType: 0, // Discord
			clientId: BigInt(TEST_CHANNEL_CLIENT_ID),
			channelType: 2, // DiscordText
			communityId: community.id,
			batchStatus: 0,
		});
		testChannelId = channel.id;
	});

	afterEach(async () => {
		await ReminderRepositoryImpl.destroy({ truncate: true, force: true });
		await ChannelRepositoryImpl.destroy({ truncate: true, force: true });
		await UserRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
	});

	// =========================================================================
	// ReminderListCommandHandler のテスト
	// =========================================================================
	describe("ReminderListCommandHandler", () => {
		/**
		 * [リスト表示] リマインダーが登録されていない場合はその旨を表示する
		 */
		it("should show message when no reminders exist", async () => {
			const commandMock = await executeCommand("reminderlist");

			verify(commandMock.reply("リマインドは予約されていないよ！っ")).once();
		});

		/**
		 * [リスト表示] 登録されているリマインダーの一覧が表示される
		 */
		it("should display formatted list of registered reminders", async () => {
			await ReminderRepositoryImpl.bulkCreate([
				createReminderTestData(testCommunityId, testUserId, testChannelId, { message: "reminderlist test 1" }),
				createReminderTestData(testCommunityId, testUserId, testChannelId, { message: "reminderlist test 2" }),
			]);

			const commandMock = mockSlashCommand("reminderlist");
			let capturedReply = "";
			when(commandMock.reply(anything())).thenCall((args: string) => {
				capturedReply = args;
			});

			const client = await TestDiscordServer.getClient();
			client.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);

			verify(commandMock.reply("リマインドは予約されていないよ！っ")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();

			const expectedOutput =
				`- id: 1\n  - ${FUTURE_DATETIME_FORMATTED}\n  - reminderlist test 1\n` + `- id: 2\n  - ${FUTURE_DATETIME_FORMATTED}\n  - reminderlist test 2`;
			expect(capturedReply).to.eq(expectedOutput);
		});
	});
});
