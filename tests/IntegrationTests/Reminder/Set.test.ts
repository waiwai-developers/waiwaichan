import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { ChannelRepositoryImpl, CommunityRepositoryImpl, ReminderRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import { anything, instance, verify } from "ts-mockito";

// =============================================================================
// テスト用の定数
// =============================================================================
const TEST_GUILD_ID = "9999"; // communityのclientId（MockSlashCommandのデフォルト）
const TEST_USER_ID = "1234"; // userのclientId（MockSlashCommandのデフォルト）
const TEST_CHANNEL_CLIENT_ID = "5678"; // channelのclientId（MockSlashCommandのデフォルト）

const FUTURE_DATETIME = "2999/12/31 23:59:59";
const PAST_DATETIME = "1000/12/31 23:59:59";

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
 * リマインダーデータの検証を行う
 */
function verifyReminderData(
	reminder: { id: number; userId: number | string; channelId: number; message: string },
	expected: { id?: number; userId: number | string; channelId: number; message: string },
): void {
	if (expected.id !== undefined) {
		expect(reminder.id).to.eq(expected.id);
	}
	expect(String(reminder.userId)).to.eq(String(expected.userId));
	expect(reminder.channelId).to.eq(expected.channelId);
	expect(reminder.message).to.eq(expected.message);
}

// =============================================================================
// テスト本体
// =============================================================================
describe("Test Reminder Commands", () => {
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
	// ReminderSetCommandHandler のテスト
	// =========================================================================
	describe("ReminderSetCommandHandler", () => {
		/**
		 * [正常系] リマインダーを正常に設定できる
		 */
		it("should set reminder successfully with valid datetime and message", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: "username",
				datetime: FUTURE_DATETIME,
				message: "test reminder",
			});

			verify(commandMock.reply("リマインドの投稿を予約したよ！っ")).once();

			const reminders = await ReminderRepositoryImpl.findAll();
			expect(reminders.length).to.eq(1);

			verifyReminderData(reminders[0], {
				userId: testUserId,
				channelId: testChannelId,
				message: "test reminder",
			});
			expect(reminders[0].communityId).to.eq(testCommunityId);
		});

		/**
		 * [日時検証] 過去の日時ではリマインダーを設定できない
		 */
		it("should reject reminder with past datetime", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: "username",
				datetime: PAST_DATETIME,
				message: "test reminder",
			});

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("過去の日付のリマインドは設定できないよ！っ")).once();
		});

		/**
		 * [パラメータ検証] ユーザー名がnullの場合はエラーになる
		 */
		it("should return error when username is null", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: null,
				datetime: FUTURE_DATETIME,
				message: "test reminder",
			});

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [パラメータ検証] 日時がnullの場合はエラーになる
		 */
		it("should return error when datetime is null", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: "username",
				datetime: null,
				message: "test reminder",
			});

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [パラメータ検証] メッセージがnullの場合はエラーになる
		 */
		it("should return error when message is null", async () => {
			const commandMock = await executeCommand("reminderset", {
				username: "username",
				datetime: FUTURE_DATETIME,
				message: null,
			});

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});
	});
});
