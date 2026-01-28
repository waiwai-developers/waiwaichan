import { RoleConfig } from "@/src/entities/config/RoleConfig";
import {
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
	MessageRepositoryImpl,
	StickyRepositoryImpl,
	UserRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import type { InteractionResponse } from "discord.js";
import { TextChannel } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, when } from "ts-mockito";
import { TestDiscordServer } from "../../fixtures/discord.js/TestDiscordServer";

// テスト用の定数
const TEST_GUILD_ID = "1234567890"; // communityのclientId
const TEST_USER_ID = "1234"; // userのclientId

// ============================================
// 型定義
// ============================================

/** 返り値キャプチャオブジェクト */
interface ReplyCapture {
	getValue: () => string;
}

// ============================================
// モックファクトリ関数
// ============================================

/**
 * RoleConfigのモック設定
 * @param userId ユーザーID
 * @param role ロール ('admin' | 'user')
 */
function setupRoleConfig(userId: string, role: "admin" | "user"): void {
	RoleConfig.users = [{ discordId: userId, role }];
}

/**
 * replyメソッドのモックを設定し、返り値をキャプチャする
 * @param commandMock コマンドモック
 * @returns キャプチャされた返り値を取得するオブジェクト
 */
function setupReplyCapture(commandMock: ReturnType<typeof mockSlashCommand>): ReplyCapture {
	let replyValue = "";
	when(commandMock.reply(anything())).thenCall((message: string) => {
		replyValue = message;
		return Promise.resolve({} as InteractionResponse);
	});
	return { getValue: () => replyValue };
}

/**
 * コマンドの基本設定を行う（guildId, channel）
 * @param commandMock コマンドモック
 * @param guildId ギルドID
 */
function setupCommandBasics(commandMock: ReturnType<typeof mockSlashCommand>, guildId: string): void {
	when(commandMock.guildId).thenReturn(guildId);
	when(commandMock.channel).thenReturn({} as any);
}

// ============================================
// テストデータ作成ヘルパー
// ============================================

/**
 * Community と User を作成するヘルパー関数
 */
async function createCommunityAndUser(): Promise<{
	communityId: number;
	userId: number;
}> {
	// Create community
	const community = await CommunityRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_GUILD_ID),
		batchStatus: 0,
	});

	// Create user
	const user = await UserRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_USER_ID),
		userType: 0, // user
		communityId: community.id,
		batchStatus: 0,
	});

	return {
		communityId: community.id,
		userId: user.id,
	};
}

/**
 * テスト用Channelを作成するヘルパー関数
 * @param communityId コミュニティID
 * @param channelClientId チャンネルのクライアントID（Discord上のチャンネルID）
 * @returns 作成されたチャンネルのID
 */
async function createTestChannel(communityId: number, channelClientId: string): Promise<number> {
	const channel = await ChannelRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(channelClientId),
		channelType: 2, // DiscordText
		communityId: communityId,
		batchStatus: 0,
	});
	return channel.id;
}

// ============================================
// Repository検証ヘルパー関数
// ============================================

/**
 * スティッキーの件数を検証
 * @param expectedCount 期待されるスティッキーの件数
 */
async function expectStickyCount(expectedCount: number): Promise<void> {
	const stickies = await StickyRepositoryImpl.findAll();
	expect(stickies.length).to.eq(expectedCount);
}

/**
 * スティッキーが存在しないことを検証
 */
async function expectNoStickies(): Promise<void> {
	await expectStickyCount(0);
}

describe("Test StickyDeleteCommandHandler", () => {
	// テスト用のコミュニティとユーザーのID（autoincrement）
	let testCommunityId: number;
	let testUserId: number;

	beforeEach(async () => {
		new MysqlConnector();
		// Clean up existing records
		await StickyRepositoryImpl.destroy({ truncate: true, force: true });
		await MessageRepositoryImpl.destroy({ truncate: true, force: true });
		await ChannelRepositoryImpl.destroy({ truncate: true, force: true });
		await UserRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
		// Create community and user for each test
		const { communityId, userId } = await createCommunityAndUser();
		testCommunityId = communityId;
		testUserId = userId;
	});

	afterEach(async () => {
		await StickyRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await MessageRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await ChannelRepositoryImpl.destroy({
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

	/**
	- [権限チェック] 管理者権限がない場合はスティッキーを削除できない
	- - コマンド実行時に権限チェックが行われることを検証
	- - 権限がない場合にエラーメッセージが返されることを検証
	- - StickyLogic.deleteメソッドが呼ばれないことを検証
	 */
	it("should not delete sticky when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 非管理者ユーザーIDを設定
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// RoleConfigのモック - 明示的に非管理者として設定
			setupRoleConfig(userId, "user");

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			setupCommandBasics(commandMock, guildId);

			// replyメソッドをモック
			const replyCapture = setupReplyCapture(commandMock);

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyCapture.getValue()).to.eq("スティッキーを登録する権限を持っていないよ！っ");

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();
		})();
	});

	/**
	 * [存在チェック] 登録されていないスティッキーは削除できない
	 * - StickyLogic.findが呼ばれることを検証
	 * - スティッキーが存在しない場合にエラーメッセージが返されることを検証
	 * - StickyLogic.deleteが呼ばれないことを検証
	 */
	it("should not delete sticky when sticky does not exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelId = "2";

			// RoleConfigのモック - 管理者として設定
			setupRoleConfig(TEST_USER_ID, "admin");

			// テスト用Channelを作成
			await createTestChannel(testCommunityId, channelId);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelId }, TEST_USER_ID);

			// guildIdとchannelを設定
			setupCommandBasics(commandMock, TEST_GUILD_ID);

			// replyメソッドをモック
			const replyCapture = setupReplyCapture(commandMock);

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyCapture.getValue()).to.eq("スティッキーが登録されていなかったよ！っ");

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();
		})();
	});
	/**
	 * [チャンネル検証] チャンネルが存在しない場合はエラーになる
	 * - チャンネルの存在チェックが行われることを検証
	 * - チャンネルが存在しない場合にエラーメッセージが返されることを検証
	 * - StickyLogic.deleteが呼ばれないことを検証
	 */
	it("should not delete sticky when channel does not exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// チャンネルが存在しないようにguildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							// チャンネルが存在しないのでundefinedを返す
							return undefined;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 2000);

			// 応答の検証 - チャンネルが存在しない場合のエラーメッセージ
			expect(replyValue).to.eq("スティッキーの投稿がなかったよ！っ");

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);
		})();
	});

	/**
	 * [チャンネル型検証] TextChannel以外のスティッキーは削除できない
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合にエラーメッセージが返されることを検証
	 * - StickyLogic.deleteが呼ばれないことを検証
	 * */
	it("should not delete sticky when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// スティッキーをデータベースに作成（DBのchannel.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannel以外のチャンネルを返すようにguildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								// TextChannelではないオブジェクトを返す
								return {}; // instanceof TextChannel は false を返す
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証 - TextChannel以外の場合のエラーメッセージ
			expect(replyValue).to.eq("このチャンネルのスティッキーを削除できないよ！っ");

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);
		})();
	});

	/**
	 * [メッセージ削除] スティッキーメッセージが削除される
	 * - メッセージのdeleteメソッドが呼ばれることを検証
	 * - 削除に成功した場合にStickyLogic.deleteが呼ばれることを検証
	 */
	it("should delete sticky message when command is executed successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageClientId = "4";
			const message = "スティッキーのメッセージ";

			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// Messageテーブルにデータを作成
			const dbMessage = await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(messageClientId),
				communityId: testCommunityId,
				userId: testUserId,
				channelId: dbChannelId,
				batchStatus: 0,
			});

			// スティッキーをデータベースに作成（DBのchannel.idとMessage.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: String(dbMessage.id),
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// メッセージのモック
			const messageMock = {
				id: messageClientId,
				content: message,
				delete: () => {
					return Promise.resolve(true);
				},
			};

			// TextChannelのモック
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype
			textChannelMock.messages = {
				fetch: (id: string) => {
					return Promise.resolve(messageMock);
				},
			};

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// deferReplyとeditReplyメソッドをモック
			when(commandMock.deferReply()).thenResolve({} as any);
			let editReplyValue = "";
			when(commandMock.editReply(anything())).thenCall((message: string) => {
				editReplyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 応答の検証 - 削除成功メッセージ
			expect(editReplyValue).to.eq("スティッキーを削除したよ！っ");

			// データベースからスティッキーが削除されていることを確認
			await expectNoStickies();
		})();
	});

	/**
	 * [削除失敗] メッセージの削除に失敗した場合はエラーメッセージが返される
	 * - メッセージの削除に失敗した場合にエラーメッセージが返されることを検証
	 * - StickyLogic.deleteが呼ばれないことを検証
	 */
	it("should return error message when message deletion fails", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageClientId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// Messageテーブルにデータを作成
			const dbMessage = await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(messageClientId),
				communityId: testCommunityId,
				userId: testUserId,
				channelId: dbChannelId,
				batchStatus: 0,
			});

			// スティッキーをデータベースに作成（DBのchannel.idとMessage.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: String(dbMessage.id),
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// メッセージのモック - 削除に失敗するように設定
			const messageMock = {
				id: messageClientId,
				content: message,
				delete: () => {
					return Promise.resolve(false); // 削除に失敗
				},
			};

			// TextChannelのモック
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype
			textChannelMock.messages = {
				fetch: (id: string) => {
					return Promise.resolve(messageMock);
				},
			};

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// 応答の検証 - 削除失敗メッセージ
			expect(replyValue).to.eq("スティッキーの削除に失敗したよ！っ");

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);
		})();
	});

	/**
	 * [スティッキー削除] 正常にスティッキーが削除される
	 * - StickyLogic.deleteが正しいパラメータで呼ばれることを検証
	 * - 削除成功時に成功メッセージが返されることを検証
	 */
	it("should call StickyLogic.delete with correct parameters and return success message", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId = "2";
			const messageClientId = "4";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// Messageテーブルにデータを作成
			const dbMessage = await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(messageClientId),
				communityId: testCommunityId,
				userId: testUserId,
				channelId: dbChannelId,
				batchStatus: 0,
			});

			// スティッキーをデータベースに作成（DBのchannel.idとMessage.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: String(dbMessage.id),
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickydelete", { channelid: channelClientId }, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// メッセージのモック
			const messageMock = {
				id: messageClientId,
				content: message,
				delete: () => {
					return Promise.resolve(true);
				},
			};

			// TextChannelのモック
			const textChannelMock = Object.create(TextChannel.prototype);
			textChannelMock.id = channelClientId;
			textChannelMock.type = 0; // TextChannelのtype
			textChannelMock.messages = {
				fetch: (id: string) => {
					return Promise.resolve(messageMock);
				},
			};

			// guildのモックを設定
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelClientId) {
								return textChannelMock;
							}
							return null;
						},
					},
				},
			} as any);

			// deferReplyとeditReplyメソッドをモック
			when(commandMock.deferReply()).thenResolve({} as any);
			let editReplyValue = "";
			when(commandMock.editReply(anything())).thenCall((message: string) => {
				editReplyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			await expectStickyCount(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 処理が完了するまで待つ
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 応答の検証 - 削除成功メッセージ
			expect(editReplyValue).to.eq("スティッキーを削除したよ！っ");

			// データベースにスティッキーが存在しないことを確認
			await expectNoStickies();
		})();
	});
});
