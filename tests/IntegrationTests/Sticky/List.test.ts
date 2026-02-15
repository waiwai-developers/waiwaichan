import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { ChannelRepositoryImpl, CommunityRepositoryImpl, StickyRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import type Mocha from "mocha";
import { anything, instance, when } from "ts-mockito";
import { TestDiscordServer } from "../../fixtures/discord.js/TestDiscordServer";

// テスト用の定数
const TEST_GUILD_ID = "1234567890"; // communityのclientId
const TEST_USER_ID = "1234"; // userのclientId

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

describe("Test StickyListCommandHandler", () => {
	// テスト用のコミュニティとユーザーのID（autoincrement）
	let testCommunityId: number;
	let testUserId: number;

	beforeEach(async () => {
		new MysqlConnector();
		// Clean up existing records
		await StickyRepositoryImpl.destroy({ truncate: true, force: true });
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
	 * [スティッキーリスト表示] スティッキーが登録されていない場合はその旨を表示する
	 * - StickyLogic.findByCommunityIdメソッドが呼ばれることを検証
	 * - スティッキーが登録されていない場合にその旨のメッセージが表示されることを検証
	 */
	it("should display message when no stickies are registered", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickylist", {}, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在しないことを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("スティッキーが登録されていなかったよ！っ");

			// データベースにスティッキーが存在しないことを確認
			const afterStickies = await StickyRepositoryImpl.findAll();
			expect(afterStickies.length).to.eq(0);
		})();
	});

	/**
	 * [リスト表示] 登録されているスティッキーの一覧が表示される
	 * - StickyLogic.findByCommunityIdが正しいパラメータで呼ばれることを検証
	 * - 返されたスティッキーリストが適切にフォーマットされて表示されることを検証
	 * - チャンネルIDが正しくDiscordのメンション形式（<#ID>）で表示されることを検証
	 * */
	it("should display formatted sticky list with correct channel mentions", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 管理者ユーザーIDを設定
			const channelClientId1 = BigInt("123456789012345678");
			const channelClientId2 = BigInt("223456789012345678");
			const messageId = "5";
			const message = "スティッキーのメッセージ";

			// RoleConfigのモック - 管理者として設定
			RoleConfig.users = [
				{ discordId: TEST_USER_ID, role: "admin" }, // 管理者として設定
			];

			// チャンネルをデータベースに作成
			const channel1 = await ChannelRepositoryImpl.create({
				categoryType: 0, // Discord
				communityId: testCommunityId,
				clientId: channelClientId1,
				channelType: 0, // テキストチャンネル
				batchStatus: 0,
			});

			const channel2 = await ChannelRepositoryImpl.create({
				categoryType: 0, // Discord
				communityId: testCommunityId,
				clientId: channelClientId2,
				channelType: 0, // テキストチャンネル
				batchStatus: 0,
			});

			// スティッキーをデータベースに作成（channelIdはchannelsテーブルのidを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: channel1.id,
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: channel2.id,
				userId: testUserId,
				messageId: messageId,
				message: message,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("stickylist", {}, TEST_USER_ID);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(2);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			// 1. 適切なフォーマットで表示されていることを検証
			expect(replyValue).to.include("以下のチャンネルにスティッキーが登録されているよ！");

			// 2. チャンネルのclientIdが正しくDiscordのメンション形式（<#ID>）で表示されていることを検証
			expect(replyValue).to.include(`<#${channelClientId1}>`);
			expect(replyValue).to.include(`<#${channelClientId2}>`);

			// 3. 返されたスティッキーリストが適切にフォーマットされていることを検証
			// 各チャンネルが箇条書き（- で始まる行）で表示されていることを確認
			const lines = replyValue.split("\n");
			expect(lines.length).to.be.at.least(3); // ヘッダー + 2つのチャンネル
			expect(lines[0]).to.eq("以下のチャンネルにスティッキーが登録されているよ！");
			expect(lines[1]).to.match(/^- <#\d+>$/);
			expect(lines[2]).to.match(/^- <#\d+>$/);
		})();
	});
});
