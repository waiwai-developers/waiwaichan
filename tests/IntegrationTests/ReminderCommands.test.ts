import { clearInterval } from "node:timers";
import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { ReminderNotifyHandler } from "@/src/handlers/discord.js/events/ReminderNotifyHandler";
import { CommunityRepositoryImpl, ReminderRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import dayjs from "dayjs";
import { type Channel, type ChannelManager, type Client, type Collection, type Snowflake, TextChannel } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

// テスト用の定数
const TEST_GUILD_ID = "9999"; // communityのclientId（MockSlashCommandのデフォルト）
const TEST_USER_ID = "1234"; // userのclientId（MockSlashCommandのデフォルト）
const TEST_CHANNEL_ID = "5678"; // channelId（MockSlashCommandのデフォルト）

describe("Test Reminder Commands", () => {
	// テスト用のコミュニティのID（autoincrement）
	let testCommunityId: number;
	let testUserId: number;

	/**
	 * テスト実行前に毎回実行される共通のセットアップ
	 */
	beforeEach(async () => {
		// Initialize database connection first
		new MysqlConnector();
		// Clean up existing records
		await ReminderRepositoryImpl.destroy({ truncate: true, force: true });
		await UserRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });

		// Create community for each test
		const community = await CommunityRepositoryImpl.create({
			categoryType: 0, // Discord
			clientId: BigInt(TEST_GUILD_ID),
			batchStatus: 0,
		});
		testCommunityId = community.id;

		// Create user for each test
		const user = await UserRepositoryImpl.create({
			categoryType: 0, // Discord
			clientId: BigInt(TEST_USER_ID),
			userType: 0, // user
			communityId: community.id,
			batchStatus: 0,
		});
		testUserId = user.id;
	});

	/**
	 * ReminderSetCommandHandlerのテスト
	 */

	/**
	 * [正常系] リマインダーを正常に設定できる
	 * - コマンド実行時にリマインダーが登録されることを検証
	 * - 成功メッセージが返されることを検証
	 * - データベースに正しいパラメータでリマインダーが保存されることを検証
	 */
	it("test /reminderset datetime:2999/12/31 23:59:59 message:feature reminder", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			username: "username",
			datetime: "2999/12/31 23:59:59",
			message: "test reminder",
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply("リマインドの投稿を予約したよ！っ")).once();
		const res = await ReminderRepositoryImpl.findAll();
		expect(res.length).to.eq(1);

		expect(res[0].id).to.eq(1);
		expect(res[0].communityId).to.eq(testCommunityId);
		expect(String(res[0].userId)).to.eq(String(TEST_USER_ID));
		expect(String(res[0].channelId)).to.eq(String(TEST_CHANNEL_ID));
		expect(res[0].message).to.eq("test reminder");
	});

	/**
	 * [日時検証] 過去の日時ではリマインダーを設定できない
	 * - 過去の日時が指定された場合にエラーメッセージが返されることを検証
	 * - リマインダーが登録されないことを検証
	 */
	it("test /reminderset when old datetime", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			username: "username",
			datetime: "1000/12/31 23:59:59",
			message: "test reminder",
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("過去の日付のリマインドは設定できないよ！っ")).once();
	});

	/**
	 * [パラメータ検証] ユーザー名がnullの場合はエラーになる
	 * - ユーザー名がnullの場合にエラーメッセージが返されることを検証
	 * - 内部エラーメッセージが表示されることを検証
	 */
	it("test /reminderset with null username", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			username: null,
			datetime: "2999/12/31 23:59:59",
			message: "test reminder",
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	/**
	 * [パラメータ検証] 日時がnullの場合はエラーになる
	 * - 日時がnullの場合にエラーメッセージが返されることを検証
	 * - 内部エラーメッセージが表示されることを検証
	 */
	it("test /reminderset with null datetime", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			username: "username",
			datetime: null,
			message: "test reminder",
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	/**
	 * [パラメータ検証] メッセージがnullの場合はエラーになる
	 * - メッセージがnullの場合にエラーメッセージが返されることを検証
	 * - 内部エラーメッセージが表示されることを検証
	 */
	it("test /reminderset with null message", async () => {
		const commandMock = mockSlashCommand("reminderset", {
			username: "username",
			datetime: "2999/12/31 23:59:59",
			message: null,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	/**
	 * ReminderListCommandHandlerのテスト
	 */

	/**
	 * [リスト表示] リマインダーが登録されていない場合はその旨を表示する
	 * - リマインダーが存在しない場合に適切なメッセージが返されることを検証
	 */
	it("test /reminderlist with no remind", async () => {
		const commandMock = mockSlashCommand("reminderlist");

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply("リマインドは予約されていないよ！っ")).once();
	});

	/**
	 * [リスト表示] 登録されているリマインダーの一覧が表示される
	 * - 複数のリマインダーが登録されている場合に一覧が表示されることを検証
	 * - リマインダーが適切なフォーマットで表示されることを検証
	 * - ID、日時、メッセージが正しく表示されることを検証
	 */
	it("test /reminderlist when remind contain", async () => {
		await ReminderRepositoryImpl.bulkCreate([
			{
				communityId: testCommunityId,
				userId: TEST_USER_ID,
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 1",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				communityId: testCommunityId,
				userId: TEST_USER_ID,
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 2",
				remindAt: "2999/12/31 23:59:59",
			},
		]);
		const commandMock = mockSlashCommand("reminderlist");
		let res = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			res = args;
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply("リマインドは予約されていないよ！っ")).never();
		verify(commandMock.reply(InternalErrorMessage)).never();

		expect(res).to.eq(
			"- id: 1\n" + "  - 3000-01-01 08:59:59\n" + "  - reminderlist test 1\n" + "- id: 2\n" + "  - 3000-01-01 08:59:59\n" + "  - reminderlist test 2",
		);
	});

	/**
	 * ReminderDeleteCommandHandlerのテスト
	 */

	/**
	 * [正常系] 存在するリマインダーを削除できる
	 * - 指定したIDのリマインダーが削除されることを検証
	 * - 成功メッセージが返されることを検証
	 * - 他のリマインダーは削除されないことを検証
	 */
	it("test /reminderdelete when id exist", async () => {
		const [forDeleteObj, forNotDeleteObjSameUserId, forNotDeleteObjDifferentUserId] = await ReminderRepositoryImpl.bulkCreate([
			{
				communityId: testCommunityId,
				userId: TEST_USER_ID,
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 1",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				communityId: testCommunityId,
				userId: TEST_USER_ID,
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 2",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				communityId: testCommunityId,
				userId: "9012",
				channelId: "3456",
				receiveUserName: "username",
				message: "reminderlist test 3",
				remindAt: "2000/12/31 23:59:59",
			},
		]);

		const commandMock = mockSlashCommand("reminderdelete", {
			id: forDeleteObj.id,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("リマインドの予約を削除したよ！っ")).once();

		const res = await ReminderRepositoryImpl.findAll();
		expect(res.length).to.eq(2);

		expect(res[0].id).to.eq(forNotDeleteObjSameUserId.id);
		expect(String(res[0].userId)).to.eq(String(forNotDeleteObjSameUserId.userId));
		expect(String(res[0].channelId)).to.eq(String(forNotDeleteObjSameUserId.channelId));
		expect(res[0].message).to.eq(forNotDeleteObjSameUserId.message);

		expect(res[1].id).to.eq(forNotDeleteObjDifferentUserId.id);
		expect(String(res[1].userId)).to.eq(String(forNotDeleteObjDifferentUserId.userId));
		expect(String(res[1].channelId)).to.eq(String(forNotDeleteObjDifferentUserId.channelId));
		expect(res[1].message).to.eq(forNotDeleteObjDifferentUserId.message);
	});

	/**
	 * [ユーザー検証] 他のユーザーのリマインダーは削除できない
	 * - 異なるユーザーIDのリマインダーを削除しようとした場合にエラーメッセージが返されることを検証
	 * - リマインダーが削除されないことを検証
	 */
	it("test /reminderdelete when different user id", async () => {
		const [inserted0, inserted1, inserted2] = await ReminderRepositoryImpl.bulkCreate([
			{
				communityId: testCommunityId,
				userId: "9012",
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 1",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				communityId: testCommunityId,
				userId: TEST_USER_ID,
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 2",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				communityId: testCommunityId,
				userId: "9012",
				channelId: "3456",
				receiveUserName: "username",
				message: "reminderlist test 3",
				remindAt: "2000/12/31 23:59:59",
			},
		]);

		const commandMock = mockSlashCommand("reminderdelete", {
			id: inserted0.id,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("リマインドの予約はされていなかったよ！っ")).once();

		const res = await ReminderRepositoryImpl.findAll();
		expect(res.length).to.eq(3);

		expect(res[0].id).to.eq(inserted0.id);
		expect(String(res[0].userId)).to.eq(String(inserted0.userId));
		expect(String(res[0].channelId)).to.eq(String(inserted0.channelId));
		expect(res[0].message).to.eq(inserted0.message);

		expect(res[1].id).to.eq(inserted1.id);
		expect(String(res[1].userId)).to.eq(String(inserted1.userId));
		expect(String(res[1].channelId)).to.eq(String(inserted1.channelId));
		expect(res[1].message).to.eq(inserted1.message);

		expect(res[2].id).to.eq(inserted2.id);
		expect(String(res[2].userId)).to.eq(String(inserted2.userId));
		expect(String(res[2].channelId)).to.eq(String(inserted2.channelId));
		expect(res[2].message).to.eq(inserted2.message);
	});

	/**
	 * [存在チェック] 存在しないリマインダーは削除できない
	 * - 存在しないIDを指定した場合にエラーメッセージが返されることを検証
	 */
	it("test /reminderdelete when id not exist", async () => {
		const commandMock = mockSlashCommand("reminderdelete", {
			id: 0,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("リマインドの予約はされていなかったよ！っ")).once();
	});

	/**
	 * [パラメータ検証] IDがnullの場合はエラーになる
	 * - IDがnullの場合にエラーメッセージが返されることを検証
	 * - 内部エラーメッセージが表示されることを検証
	 */
	it("test /reminderdelete when id is null", async () => {
		const commandMock = mockSlashCommand("reminderdelete", {
			id: null,
		});

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	/**
	 * ReminderNotifyHandlerのテスト
	 */

	/**
	 * [リマインダー通知] 指定時刻に達したリマインダーが通知される
	 * - 時刻が過ぎたリマインダーがチャンネルに送信されることを検証
	 * - 送信後にリマインダーが削除されることを検証
	 * - 未来のリマインダーは削除されないことを検証
	 */
	it("test reminder", async () => {
		const [inserted0, inserted1, inserted2] = await ReminderRepositoryImpl.bulkCreate([
			{
				communityId: testCommunityId,
				userId: "9012",
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 1",
				remindAt: dayjs().subtract(1, "second"),
			},
			{
				communityId: testCommunityId,
				userId: TEST_USER_ID,
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 2",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				communityId: testCommunityId,
				userId: "9012",
				channelId: "3456",
				receiveUserName: "username",
				message: "reminderlist test 3",
				remindAt: "2999/12/31 23:59:59",
			},
		]);

		const channelMock = mock<TextChannel>();
		when(channelMock.send(anything())).thenCall((args) => {});
		const mockedChannel = instance(channelMock);
		Object.setPrototypeOf(mockedChannel, TextChannel.prototype);
		const cacheMock = mock<Collection<Snowflake, Channel>>();
		when(cacheMock.get(anything())).thenReturn(mockedChannel);
		const channelManagerMock = mock<ChannelManager>();
		when(channelManagerMock.cache).thenReturn(instance(cacheMock));
		const clientMock = mock<Client>();
		when(clientMock.channels).thenReturn(instance(channelManagerMock));

		await ReminderNotifyHandler(instance(clientMock));

		await new Promise((resolve, reject) => {
			const startTime = Date.now();
			const timer = setInterval(() => {
				try {
					verify(channelMock.send(anything())).atLeast(1);
					clearInterval(timer);
					return resolve(null);
				} catch (_) {
					if (Date.now() - startTime > 500) {
						clearInterval(timer);
						reject(new Error("Timeout: Method was not called within the time limit."));
					}
				}
			}, 100);
		});

		const res = await ReminderRepositoryImpl.findAll();
		expect(res.length).to.eq(2);

		expect(res[0].id).to.eq(inserted1.id);
		expect(String(res[0].userId)).to.eq(String(inserted1.userId));
		expect(String(res[0].channelId)).to.eq(String(inserted1.channelId));
		expect(res[0].message).to.eq(inserted1.message);

		expect(res[1].id).to.eq(inserted2.id);
		expect(String(res[1].userId)).to.eq(String(inserted2.userId));
		expect(String(res[1].channelId)).to.eq(String(inserted2.channelId));
		expect(res[1].message).to.eq(inserted2.message);
	});

	/**
	 * [リマインダー通知] リマインダーが登録されていない場合は何も送信されない
	 * - リマインダーが存在しない場合にチャンネルへの送信が行われないことを検証
	 */
	it("test reminder no post when no reminder registered", async () => {
		const channelMock = mock<TextChannel>();
		const mockedChannel = instance(channelMock);
		Object.setPrototypeOf(mockedChannel, TextChannel.prototype);
		const cacheMock = mock<Collection<Snowflake, Channel>>();
		when(cacheMock.get(anything())).thenReturn(mockedChannel);
		const channelManagerMock = mock<ChannelManager>();
		when(channelManagerMock.cache).thenReturn(instance(cacheMock));
		const clientMock = mock<Client>();
		when(clientMock.channels).thenReturn(instance(channelManagerMock));
		await ReminderNotifyHandler(instance(clientMock));
		try {
			await new Promise((resolve, reject) => {
				const startTime = Date.now();
				const timer = setInterval(() => {
					try {
						verify(channelMock.send(anything())).atLeast(1);
						clearInterval(timer);
						return resolve(null);
					} catch (_) {
						if (Date.now() - startTime > 500) {
							clearInterval(timer);
							reject(new Error("Timeout: Method was not called within the time limit."));
						}
					}
				}, 100);
			});
		} catch (e) {
			verify(channelMock.send(anything())).never();
			return;
		}
		expect("expect reach here").to.false;
	});

	/**
	 * [エラーハンドリング] 送信エラー時はリマインダーが削除されない
	 * - 送信時にエラーが発生した場合にリマインダーが削除されないことを検証
	 * - トランザクションのロールバックが正しく行われることを検証
	 */
	it("test reminder on error", async () => {
		const [inserted0, inserted1, inserted2] = await ReminderRepositoryImpl.bulkCreate([
			{
				communityId: testCommunityId,
				userId: "9012",
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 1",
				remindAt: dayjs().subtract(1, "second"),
			},
			{
				communityId: testCommunityId,
				userId: TEST_USER_ID,
				channelId: TEST_CHANNEL_ID,
				receiveUserName: "username",
				message: "reminderlist test 2",
				remindAt: "2999/12/31 23:59:59",
			},
			{
				communityId: testCommunityId,
				userId: "9012",
				channelId: "3456",
				receiveUserName: "username",
				message: "reminderlist test 3",
				remindAt: "2999/12/31 23:59:59",
			},
		]);

		const channelMock = mock<TextChannel>();
		when(channelMock.send(anything())).thenThrow(new Error("mock error"));
		const mockedChannel = instance(channelMock);
		Object.setPrototypeOf(mockedChannel, TextChannel.prototype);
		const cacheMock = mock<Collection<Snowflake, Channel>>();
		when(cacheMock.get(anything())).thenReturn(mockedChannel);
		const channelManagerMock = mock<ChannelManager>();
		when(channelManagerMock.cache).thenReturn(instance(cacheMock));
		const clientMock = mock<Client>();
		when(clientMock.channels).thenReturn(instance(channelManagerMock));

		try {
			await ReminderNotifyHandler(instance(clientMock));
		} catch (_) {
			// Expected error due to mock error
		}

		// Wait a bit for any async operations to complete
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Verify that the reminder was NOT deleted because of the error (rollback occurred)
		const res = await ReminderRepositoryImpl.findAll();
		expect(res.length).to.eq(3);

		expect(res[0].id).to.eq(inserted0.id);
		expect(String(res[0].userId)).to.eq(String(inserted0.userId));
		expect(String(res[0].channelId)).to.eq(String(inserted0.channelId));
		expect(res[0].message).to.eq(inserted0.message);

		expect(res[1].id).to.eq(inserted1.id);
		expect(String(res[1].userId)).to.eq(String(inserted1.userId));
		expect(String(res[1].channelId)).to.eq(String(inserted1.channelId));
		expect(res[1].message).to.eq(inserted1.message);

		expect(res[2].id).to.eq(inserted2.id);
		expect(String(res[2].userId)).to.eq(String(inserted2.userId));
		expect(String(res[2].channelId)).to.eq(String(inserted2.channelId));
		expect(res[2].message).to.eq(inserted2.message);
	});

	afterEach(async () => {
		await ReminderRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await UserRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await CommunityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
	});
});
