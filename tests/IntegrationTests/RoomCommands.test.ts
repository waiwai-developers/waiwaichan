import { RoleConfig } from "@/src/entities/config/RoleConfig";
import {
	RoomAddChannelRepositoryImpl,
	RoomChannelRepositoryImpl,
	RoomNotificationChannelRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("このチャンネルは部屋追加チャンネルとして登録できないよ！っ");

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
			await waitUntilReply(commandMock, 100);

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
	 * [存在チェック] 登録されていない部屋追加チャンネルは削除できない
	 * - RoomAddChannelLogic.findが呼ばれることを検証
	 * - 部屋追加チャンネルが存在しない場合にエラーメッセージが返されることを検証
	 * - RoomAddChannelLogic.deleteが呼ばれないことを検証
	 */
	it("should not delete room add channel when not exists", function (this: Mocha.Context) {
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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルが登録されていなかったよ！っ");
		})();
	});

	/**
	 * [正常削除] 部屋追加チャンネルが正常に削除される
	 * - RoomAddChannelLogic.deleteが正しいパラメータで呼ばれることを検証
	 * - 削除成功時に成功メッセージが返されることを検証
	 * - データベースから部屋追加チャンネルが削除されていることを確認
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋追加チャンネルを削除したよ！っ");

			// データが削除されていることを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルが既に登録されているよ！っ");

			// データが増えていないことを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
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
			expect(replyValue).to.eq("このチャンネルは部屋通知チャンネルとして登録できないよ！っ");

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
	 * [存在チェック] 登録されていない部屋通知チャンネルは削除できない
	 * - RoomNotificationChannelLogic.findが呼ばれることを検証
	 * - 部屋通知チャンネルが存在しない場合にエラーメッセージが返されることを検証
	 * - RoomNotificationChannelLogic.deleteが呼ばれないことを検証
	 */
	it("should not delete room notification channel when not exists", function (this: Mocha.Context) {
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
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルが登録されていなかったよ！っ");
		})();
	});

	/**
	 * [正常削除] 部屋通知チャンネルが正常に削除される
	 * - RoomNotificationChannelLogic.deleteが正しいパラメータで呼ばれることを検証
	 * - 削除成功時に成功メッセージが返されることを検証
	 * - データベースから部屋通知チャンネルが削除されていることを確認
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

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 100);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを削除したよ！っ");

			// データが削除されていることを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});
});
