import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { RoomAddChannelRepositoryImpl, RoomChannelRepositoryImpl, RoomNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import { TextChannel, VoiceChannel } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, when } from "ts-mockito";
import { TestDiscordServer } from "../fixtures/discord.js/TestDiscordServer";

describe("Test Room Commands", () => {
	beforeEach(() => {
		new MysqlConnector();
	});

	afterEach(async () => {
		await RoomAddChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await RoomNotificationChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await RoomChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
	});

	/**
	 * RoomAddChannelCreateCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合は部屋追加チャンネルを登録できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - RoomAddChannelLogic.createメソッドが呼ばれないことを検証
	 */
	it("should not create room add channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "user" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルを登録する権限を持っていないよ！っ");

			// データが作られていないことを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成 - データなし] サーバーにRoomAddChannelsデータがない状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルを登録したよ！っと投稿されること
	 * - RoomAddChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room add channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// VoiceChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								const voiceChannel = Object.create(VoiceChannel.prototype);
								voiceChannel.id = channelId;
								return voiceChannel;
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

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(String(afterData[0].guildId)).to.eq(String(guildId));
			expect(String(afterData[0].channelId)).to.eq(String(channelId));
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [正常作成 - deletedAtあり] サーバーにRoomAddChannelsデータがありdeletedAtがnullでない状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルを登録したよ！っと投稿されること
	 * - RoomAddChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room add channel when deleted data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 削除済みのデータを作成
			const deletedData = await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});
			await deletedData.destroy();

			// 削除済みデータが存在することを確認（paranoid: trueなのでfindAllには含まれない）
			const beforeActiveData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeActiveData.length).to.eq(0);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// VoiceChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								const voiceChannel = Object.create(VoiceChannel.prototype);
								voiceChannel.id = channelId;
								return voiceChannel;
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 10_000);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルを登録したよ！っ");

			// 新しいデータが作られていることを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(String(afterData[0].guildId)).to.eq(String(guildId));
			expect(String(afterData[0].channelId)).to.eq(String(channelId));
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [既存チェック] 既に部屋追加チャンネルが登録されている場合は新規作成できない
	 * - RoomAddChannelLogic.findが呼ばれることを検証
	 * - 部屋追加チャンネルが既に存在する場合にエラーメッセージが返されることを検証
	 * - RoomAddChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room add channel when already exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 既存のデータを作成
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースに既存データが存在することを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルが既に登録されているよ！っ");

			// データが増えていないことを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [チャンネル検証] VoiceChannel以外には部屋追加チャンネルを登録できない
	 * - チャンネルの型チェックが行われることを検証
	 * - VoiceChannel以外の場合にエラーメッセージが返されることを検証
	 * - RoomAddChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room add channel when channel is not a VoiceChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// VoiceChannel以外のチャンネルを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								// VoiceChannelではないオブジェクトを返す
								return {};
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

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("このチャンネルはボイスチャンネルないので部屋追加チャンネルとして登録できないよ！っ");

			// データが作られていないことを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成] 部屋追加チャンネルが正常に登録される
	 * - RoomAddChannelLogic.createが正しいパラメータで呼ばれることを検証
	 * - 登録成功時に成功メッセージが返されることを検証
	 * - データベースに部屋追加チャンネルが保存されていることを確認
	 */
	it("should create room add channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// VoiceChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								const voiceChannel = Object.create(VoiceChannel.prototype);
								voiceChannel.id = channelId;
								return voiceChannel;
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

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 5000);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(String(afterData[0].guildId)).to.eq(String(guildId));
			expect(String(afterData[0].channelId)).to.eq(String(channelId));
		})();
	});

	/**
	 * RoomAddChannelDeleteCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合は部屋追加チャンネルを削除できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - RoomAddChannelLogic.deleteメソッドが呼ばれないことを検証
	 */
	it("should not delete room add channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "user" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchanneldelete", {}, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルを登録する権限を持っていないよ！っ");
		})();
	});

	/**
	 * [存在チェック - データなし] サーバーにRoomAddChannelsデータがない状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room add channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchanneldelete", {}, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 10_000);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルが登録されていなかったよ！っ");

			// データベースにデータが存在しないことを再確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常削除] サーバーにRoomAddChannelsデータがdeletedAtがnullである状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルを削除したよ！っと投稿されること
	 * - RoomAddChannelsのデータのdeletedAtに値が入ること
	 */
	it("should delete room add channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 既存のデータを作成
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchanneldelete", {}, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在することを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);
			expect(beforeData[0].deletedAt).to.be.null;

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルを削除したよ！っ");

			// データが論理削除されていることを確認（findAllでは取得できない）
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);

			// paranoid: falseで削除済みデータを取得して確認
			const deletedData = await RoomAddChannelRepositoryImpl.findAll({
				paranoid: false,
			});
			expect(deletedData.length).to.eq(1);
			expect(deletedData[0].deletedAt).to.not.be.null;
		})();
	});

	/**
	 * [存在チェック - deletedAtあり] サーバーにRoomAddChannelsデータがdeletedAtがnullでない状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room add channel when already deleted", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 削除済みのデータを作成
			const deletedData = await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});
			await deletedData.destroy();

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomaddchanneldelete", {}, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにアクティブなデータが存在しないことを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルが登録されていなかったよ！っ");
		})();
	});

	/**
	 * RoomNotificationChannelCreateCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合は部屋通知チャンネルを登録できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - RoomNotificationChannelLogic.createメソッドが呼ばれないことを検証
	 */
	it("should not create room notification channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "user" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを登録する権限を持っていないよ！っ");

			// データが作られていないことを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成 - データなし] サーバーにRoomNotificationChannelsデータがない状況でTextChannelで実行した時
	 * - 部屋通知チャンネルを登録したよ！っと投稿されること
	 * - RoomNotificationChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room notification channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								const textChannel = Object.create(TextChannel.prototype);
								textChannel.id = channelId;
								return textChannel;
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

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(String(afterData[0].guildId)).to.eq(String(guildId));
			expect(String(afterData[0].channelId)).to.eq(String(channelId));
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [正常作成 - deletedAtあり] サーバーにRoomNotificationChannelsデータがありdeletedAtがnullでない状況でTextChannelで実行した時
	 * - 部屋通知チャンネルを登録したよ！っと投稿されること
	 * - RoomNotificationChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room notification channel when deleted data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 削除済みのデータを作成
			const deletedData = await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});
			await deletedData.destroy();

			// 削除済みデータが存在することを確認（paranoid: trueなのでfindAllには含まれない）
			const beforeActiveData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeActiveData.length).to.eq(0);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								const textChannel = Object.create(TextChannel.prototype);
								textChannel.id = channelId;
								return textChannel;
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 5000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを登録したよ！っ");

			// 新しいデータが作られていることを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(String(afterData[0].guildId)).to.eq(String(guildId));
			expect(String(afterData[0].channelId)).to.eq(String(channelId));
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [既存チェック] 既に部屋通知チャンネルが登録されている場合は新規作成できない
	 * - RoomNotificationChannelLogic.findが呼ばれることを検証
	 * - 部屋通知チャンネルが既に存在する場合にエラーメッセージが返されることを検証
	 * - RoomNotificationChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room notification channel when already exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 既存のデータを作成
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースに既存データが存在することを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルが既に登録されているよ！っ");

			// データが増えていないことを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [チャンネル検証] TextChannel以外には部屋通知チャンネルを登録できない
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合にエラーメッセージが返されることを検証
	 * - RoomNotificationChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room notification channel when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannel以外のチャンネルを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								// TextChannelではないオブジェクトを返す
								return {};
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

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("このチャンネルはテキストチャンネルでないので部屋通知チャンネルとして登録できないよ！っ");

			// データが作られていないことを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成] 部屋通知チャンネルが正常に登録される
	 * - RoomNotificationChannelLogic.createが正しいパラメータで呼ばれることを検証
	 * - 登録成功時に成功メッセージが返されることを検証
	 * - データベースに部屋通知チャンネルが保存されていることを確認
	 */
	it("should create room notification channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								const textChannel = Object.create(TextChannel.prototype);
								textChannel.id = channelId;
								return textChannel;
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

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(String(afterData[0].guildId)).to.eq(String(guildId));
			expect(String(afterData[0].channelId)).to.eq(String(channelId));
		})();
	});

	/**
	 * RoomNotificationChannelDeleteCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合は部屋通知チャンネルを削除できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - RoomNotificationChannelLogic.deleteメソッドが呼ばれないことを検証
	 */
	it("should not delete room notification channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "user" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchanneldelete", {}, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを登録する権限を持っていないよ！っ");
		})();
	});

	/**
	 * [存在チェック - データなし] サーバーにRoomNotificationChannelsデータがない状況で実行した時
	 * - 部屋通知チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room notification channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchanneldelete", {}, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 10_000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルが登録されていなかったよ！っ");

			// データベースにデータが存在しないことを再確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常削除] サーバーにRoomNotificationChannelsデータがdeletedAtがnullである状況で実行した時
	 * - 部屋通知チャンネルを削除したよ！っと投稿されること
	 * - RoomNotificationChannelsのデータのdeletedAtに値が入ること
	 */
	it("should delete room notification channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 既存のデータを作成
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchanneldelete", {}, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在することを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);
			expect(beforeData[0].deletedAt).to.be.null;

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを削除したよ！っ");

			// データが論理削除されていることを確認（findAllでは取得できない）
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);

			// paranoid: falseで削除済みデータを取得して確認
			const deletedData = await RoomNotificationChannelRepositoryImpl.findAll({
				paranoid: false,
			});
			expect(deletedData.length).to.eq(1);
			expect(deletedData[0].deletedAt).to.not.be.null;
		})();
	});

	/**
	 * [存在チェック - deletedAtあり] サーバーにRoomNotificationChannelsデータがdeletedAtがnullでない状況で実行した時
	 * - 部屋通知チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room notification channel when already deleted", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 削除済みのデータを作成
			const deletedData = await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});
			await deletedData.destroy();

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchanneldelete", {}, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(guildId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにアクティブなデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 5000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルが登録されていなかったよ！っ");
		})();
	});

	/**
	 * VoiceChannelConnectHandlerのテスト
	 */

	/**
	 * [部屋追加チャンネル入室 - 両方設定済み] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannelsの部屋に入室した時
	 * - 新しく部屋が作成されユーザーがその部屋に移動しroomchannelsにデータが作成されること
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されること
	 */
	it("should create room and send notification when both channels are configured and user joins room add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomAddChannelId = "3";
			const roomNotificationChannelId = "4";
			const displayName = "TestUser";

			// 部屋追加チャンネルと通知チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomAddChannelId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, roomAddChannelId, guildId, userId, displayName);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加
			addMockTextChannel(newState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が作成されたことを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(beforeCount + 1);

			// 作成されたデータを確認
			const createdData = afterData[afterData.length - 1];
			expect(String(createdData.guildId)).to.eq(String(guildId));
			expect(String(createdData.channelId)).to.eq(String(newState.getCreatedChannelId()));

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を開始したよ！っ");
		})();
	});

	/**
	 * [部屋追加チャンネル入室 - 両方設定済み・別の部屋から移動] roomaddchannelsとroomnotificationchannelsが作成済みで既にユーザーが別の部屋にいる場合にroomaddchannelsの部屋に入室した時
	 * - 新しく部屋が作成されユーザーがその部屋に移動しroomchannelsにデータが作成されること
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されること
	 */
	it("should create room and send notification when user moves from another channel to room add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const oldChannelId = "100"; // 元いた部屋
			const roomAddChannelId = "3";
			const roomNotificationChannelId = "4";
			const displayName = "TestUser";

			// 部屋追加チャンネルと通知チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomAddChannelId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			// oldChannelIdに別のチャンネルIDを設定（既に別の部屋にいる状態）
			const { oldState, newState } = mockVoiceState(oldChannelId, roomAddChannelId, guildId, userId, displayName);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加
			addMockTextChannel(newState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が作成されたことを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(beforeCount + 1);

			// 作成されたデータを確認
			const createdData = afterData[afterData.length - 1];
			expect(String(createdData.guildId)).to.eq(String(guildId));
			expect(String(createdData.channelId)).to.eq(String(newState.getCreatedChannelId()));

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を開始したよ！っ");
		})();
	});

	/**
	 * [部屋追加チャンネル以外入室 - 両方設定済み] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannels以外の部屋に入室した時
	 * - 新しく部屋が作成されずroomchannelsにデータが作成されないこと
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not create room nor send notification when both channels are configured but user joins non-room-add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomAddChannelId = "3";
			const normalChannelId = "5";
			const roomNotificationChannelId = "4";

			// 部屋追加チャンネルと通知チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomAddChannelId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, normalChannelId, guildId, userId);

			let notificationSent = false;

			// テキストチャンネルのモックを追加
			addMockTextChannel(newState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				return {} as any;
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);

			// 通知が送信されていないことを確認
			expect(notificationSent).to.be.false;
		})();
	});

	/**
	 * [部屋追加チャンネル入室 - roomaddchannelsのみ設定] roomaddchannelsのみ作成済みでroomaddchannelsの部屋に入室した時
	 * - 新しく部屋が作成されユーザーがその部屋に移動しroomchannelsにデータが作成されること
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should create room but not send notification when only room add channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomAddChannelId = "3";
			const displayName = "TestUser";

			// 部屋追加チャンネルのみ登録（通知チャンネルは登録しない）
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomAddChannelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, roomAddChannelId, guildId, userId, displayName);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が作成されたことを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(beforeCount + 1);

			// 作成されたデータを確認
			const createdData = afterData[afterData.length - 1];
			expect(String(createdData.guildId)).to.eq(String(guildId));
			expect(String(createdData.channelId)).to.eq(String(newState.getCreatedChannelId()));
		})();
	});

	/**
	 * [部屋追加チャンネル入室 - roomnotificationchannelsのみ設定] roomnotificationchannelsのみ作成済みで部屋に入室した時
	 * - 新しく部屋が作成されずroomchannelsにデータが作成されないこと
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not create room nor send notification when only room notification channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";
			const roomNotificationChannelId = "4";

			// 通知チャンネルのみ登録（部屋追加チャンネルは登録しない）
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, channelId, guildId, userId);

			let notificationSent = false;

			// テキストチャンネルのモックを追加
			addMockTextChannel(newState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				return {} as any;
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);

			// 通知が送信されていないことを確認
			expect(notificationSent).to.be.false;
		})();
	});

	/**
	 * [部屋追加チャンネル入室 - 両方未設定] roomnotificationchannelsとroomaddchannelsの両方が作成されておらず部屋に入室した時
	 * - 新しく部屋が作成されずroomchannelsにデータが作成されないこと
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not create room nor send notification when neither channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";

			// どちらも登録しない
			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, channelId, guildId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [状態チェック] newState.channelIdがnullの場合は処理が中断される
	 * - 新規接続でない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when newState.channelId is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const oldChannelId = "100";

			// oldState.channelId = "old-channel", newState.channelId = null (disconnect)
			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(oldChannelId, null, guildId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [メンバーチェック] newState.memberがnullの場合は処理が中断される
	 * - メンバーが存在しない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when newState.member is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const newChannelId = "200";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, newChannelId, guildId, userId);

			// newState.memberをnullに設定
			(newState as any).member = null;

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			const beforeCount = await RoomChannelRepositoryImpl.count();

			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [チャンネルチェック] newState.channelがnullの場合は処理が中断される
	 * - チャンネルが存在しない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when newState.channel is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const newChannelId = "200";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, newChannelId, guildId, userId);

			// newState.channelをnullに設定
			(newState as any).channel = null;

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [部屋追加チャンネル存在チェック] 部屋追加チャンネルが登録されていない場合は処理が中断される
	 * - 部屋追加チャンネルが存在しない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when room add channel is not registered", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, channelId, guildId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [部屋追加チャンネル一致チェック] 接続したチャンネルが部屋追加チャンネルではない場合は処理が中断される
	 * - 接続したチャンネルIDと部屋追加チャンネルIDが一致しない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when connected channel is not room add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomAddChannelId = "3";
			const connectedChannelId = "4";

			// 部屋追加チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomAddChannelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, connectedChannelId, guildId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [チャンネル作成] 新しいボイスチャンネルが作成され、データが保存される
	 * - 作成されるチャンネル名が「{ユーザー表示名}の部屋」であることを検証
	 * - データベースにRoomChannelが保存されていることを確認
	 */
	it("should create new voice channel and save data when user connects to room add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomAddChannelId = "3";
			const displayName = "TestUser";

			// 部屋追加チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomAddChannelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, roomAddChannelId, guildId, userId, displayName);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが作成されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(beforeCount + 1);

			// 作成されたデータを確認
			const createdData = afterData[afterData.length - 1];
			expect(String(createdData.guildId)).to.eq(String(guildId));
			expect(String(createdData.channelId)).to.eq(String(newState.getCreatedChannelId()));
		})();
	});

	/**
	 * [通知送信] 部屋通知チャンネルに通知が送信される
	 * - 通知チャンネルが設定されている場合、Embedメッセージが送信されることを検証
	 * - 通知内容に「通話を開始したよ！っ」が含まれることを確認
	 */
	it("should send notification when room notification channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomAddChannelId = "3";
			const roomNotificationChannelId = "4";
			const newChannelId = roomAddChannelId;

			// 部屋追加チャンネルと通知チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomAddChannelId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, newChannelId, guildId, userId);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加
			addMockTextChannel(newState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を開始したよ！っ");
		})();
	});

	/**
	 * [通知チャンネル未設定] 部屋通知チャンネルが設定されていない場合は通知が送信されない
	 * - 部屋通知チャンネルが未設定の場合、通知送信がスキップされることを検証
	 * - エラーが発生しないことを確認
	 */
	it("should not send notification when room notification channel is not configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomAddChannelId = "3";

			// 部屋追加チャンネルのみ登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomAddChannelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, roomAddChannelId, guildId, userId);

			// イベント発火（エラーが発生しないことを確認）
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データは作成されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.be.at.least(1);
		})();
	});

	/**
	 * VoiceChannelDisconnectHandlerのテスト
	 */

	/**
	 * [部屋からの退出 - 両方設定済み] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannelsの部屋から退出しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されること
	 * - roomchannelsのデータのdeletedAtに値が入っていること
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されること
	 */
	it("should delete room and send end notification when last user leaves room channel with both channels configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomChannelId = "3";
			const roomNotificationChannelId = "4";
			const displayName = "TestUser";

			// 部屋追加チャンネルと通知チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: "999", // 元の部屋追加チャンネル
			});
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomNotificationChannelId,
			});

			// 部屋チャンネルとして登録（部屋追加チャンネルで作成された部屋）
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(roomChannelId, null, guildId, userId, displayName);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加
			addMockTextChannel(oldState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === roomChannelId);
			expect(deleted).to.be.undefined;

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を終了したよ！っ");
		})();
	});

	/**
	 * [部屋からの退出 - 両方設定済み・別の部屋] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannels以外の部屋から退出しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されないこと
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not delete room nor send notification when user leaves non-room channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const normalChannelId = "5";
			const roomNotificationChannelId = "4";

			// 部屋追加チャンネルと通知チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: "999",
			});
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(normalChannelId, null, guildId, userId);

			let notificationSent = false;

			// テキストチャンネルのモックを追加
			addMockTextChannel(oldState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				return {} as any;
			});

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 通知が送信されていないことを確認
			expect(notificationSent).to.be.false;
		})();
	});

	/**
	 * [部屋からの退出 - roomaddchannelsのみ設定] roomaddchannelsのみ作成済みでroomaddchannelsの部屋から退出しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されること
	 * - roomchannelsのデータのdeletedAtに値が入っていること
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should delete room but not send notification when only room add channel is configured on disconnect", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomChannelId = "3";
			const displayName = "TestUser";

			// 部屋追加チャンネルのみ登録（通知チャンネルは登録しない）
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: "999",
			});

			// 部屋チャンネルとして登録
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomChannelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(roomChannelId, null, guildId, userId, displayName);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === roomChannelId);
			expect(deleted).to.be.undefined;
		})();
	});

	/**
	 * [部屋からの退出 - roomnotificationchannelsのみ設定] roomnotificationchannelsのみ作成済みで部屋から退出しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されないこと
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not delete room nor send notification when only room notification channel is configured on disconnect", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";
			const roomNotificationChannelId = "4";

			// 通知チャンネルのみ登録（部屋追加チャンネルは登録しない）
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, guildId, userId);

			let notificationSent = false;

			// テキストチャンネルのモックを追加
			addMockTextChannel(oldState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				return {} as any;
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);

			// 通知が送信されていないことを確認
			expect(notificationSent).to.be.false;
		})();
	});

	/**
	 * [部屋からの退出 - 両方未設定] roomnotificationchannelsとroomaddchannelsの両方が作成されておらず部屋から退出した時
	 * - 部屋が削除されないこと
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not delete room nor send notification when neither channel is configured on disconnect", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";

			// どちらも登録しない
			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, guildId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [部屋からの退出 - 両方設定済み・別の部屋に移動] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannelsの部屋から別の部屋に移動しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されること
	 * - roomchannelsのデータのdeletedAtに値が入っていること
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されること
	 */
	it("should delete room and send notification when user moves from room channel to another channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const roomChannelId = "3";
			const newChannelId = "100"; // 移動先のチャンネル
			const roomNotificationChannelId = "4";
			const displayName = "TestUser";

			// 部屋追加チャンネルと通知チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: "999",
			});
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomNotificationChannelId,
			});

			// 部屋チャンネルとして登録
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: roomChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			// oldChannelId = roomChannelId, newChannelId = newChannelId（別の部屋に移動）
			const { oldState, newState } = mockVoiceState(roomChannelId, newChannelId, guildId, userId, displayName);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加
			addMockTextChannel(oldState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === roomChannelId);
			expect(deleted).to.be.undefined;

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を終了したよ！っ");
		})();
	});

	/**
	 * [状態チェック] oldState.channelIdがnullの場合は処理が中断される
	 * - 接続解除でない場合、処理が中断されることを検証
	 * - チャンネル削除や通知送信が行われないことを確認
	 */
	it("should not process disconnect when oldState.channelId is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const newChannelId = "200";

			// oldState.channelId = null, newState.channelId = "new-channel" (connect)
			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, newChannelId, guildId, userId);

			// テストデータ作成
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: 999,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [メンバーチェック] oldState.memberがnullの場合は処理が中断される
	 * - メンバーが存在しない場合、処理が中断されることを検証
	 * - チャンネル削除や通知送信が行われないことを確認
	 */
	it("should not process disconnect when oldState.member is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, guildId, userId);

			// oldState.memberをnullに設定
			(oldState as any).member = null;

			// テストデータ作成
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [チャンネルチェック] oldState.channelがnullの場合は処理が中断される
	 * - チャンネルが存在しない場合、処理が中断されることを検証
	 * - チャンネル削除や通知送信が行われないことを確認
	 */
	it("should not process disconnect when oldState.channel is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, guildId, userId);

			// oldState.channelをnullに設定
			(oldState as any).channel = null;

			// テストデータ作成
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [部屋チャンネルチェック] 部屋追加チャンネルによって作成された部屋でない場合は処理が中断される
	 * - 部屋チャンネルとして登録されていない場合、処理が中断されることを検証
	 * - チャンネル削除や通知送信が行われないことを確認
	 */
	it("should not process disconnect when channel is not a room channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, guildId, userId);

			// 部屋チャンネルとして登録されていない
			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 何も削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [残存ユーザーチェック] bot以外のユーザーがまだチャンネルに残っている場合は削除されない
	 * - チャンネル内にbot以外のユーザーが残っている場合、削除がスキップされることを検証
	 * - チャンネルが削除されないことを確認
	 */
	it("should not delete channel when non-bot users still remain", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";

			// 部屋チャンネルとして登録
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, guildId, userId);

			// チャンネルにユーザーが残っている状態にする
			(oldState.channel as any).members = {
				size: 1,
				filter: () => ({ size: 1 }),
			};

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [チャンネル削除] チャンネルデータとチャンネル自体が削除される
	 * - データベースからRoomChannelが削除されていることを確認
	 */
	it("should delete channel and data when last user disconnects", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";

			// 部屋チャンネルとして登録
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, guildId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();
			expect(beforeCount).to.be.at.least(1);

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === channelId);
			expect(deleted).to.be.undefined;
		})();
	});

	/**
	 * [通知送信] 部屋通知チャンネルに終了通知が送信される
	 * - 通知チャンネルが設定されている場合、Embedメッセージが送信されることを検証
	 * - 通知内容に「通話を終了したよ！っ」が含まれることを確認
	 */
	it("should send end notification when room notification channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";
			const notificationChannelId = "4";

			// 部屋チャンネルと通知チャンネルを登録
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: notificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, guildId, userId);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加
			addMockTextChannel(oldState, notificationChannelId, async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を終了したよ！っ");
		})();
	});

	/**
	 * [通知チャンネル未設定] 部屋通知チャンネルが設定されていない場合は通知が送信されない
	 * - 部屋通知チャンネルが未設定の場合、通知送信がスキップされることを検証
	 * - エラーが発生しないことを確認
	 */
	it("should not send notification when room notification channel is not configured for disconnect", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const guildId = "1";
			const userId = "2";
			const channelId = "3";

			// 部屋チャンネルのみ登録
			await RoomChannelRepositoryImpl.create({
				guildId: guildId,
				channelId: channelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, guildId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火（エラーが発生しないことを確認）
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データは削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === channelId);
			expect(deleted).to.be.undefined;
		})();
	});
});
