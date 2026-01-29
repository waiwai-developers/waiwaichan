import "reflect-metadata";
import { appContainer } from "@/src/app.di.config";
import { APPLY_CROWN_NUM } from "@/src/entities/constants/Crown";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CrownDto } from "@/src/entities/dto/CrownDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { CrownMessage } from "@/src/entities/vo/CrownMessage";
import { CrownMessageLink } from "@/src/entities/vo/CrownMessageLink";
import { MessageId } from "@/src/entities/vo/MessageId";
import type { ICrownLogic } from "@/src/logics/Interfaces/logics/ICrownLogic";
import { CommunityRepositoryImpl, CrownRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockCrownReaction } from "@/tests/fixtures/discord.js/MockReaction";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type { MessageReactionEventDetails } from "discord.js";
import type Mocha from "mocha";
import { instance, mock, when } from "ts-mockito";

describe("Test Crown Commands", () => {
	/**
	 * テスト実行前に毎回実行される共通のセットアップ
	 */
	beforeEach(() => {
		new MysqlConnector();
	});

	afterEach(async () => {
		await CrownRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await CommunityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await UserRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
	});

	// ===================================
	// Handler (CrownReactionHandler) テスト
	// ===================================
	describe("CrownReactionHandler", () => {
		/**
		 * Handler #2: Bot によるリアクションの無視
		 * user.bot が true の場合、処理がスキップされることを確認する
		 */
		it("should skip processing when reaction is from bot", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const giverId = "1234";
				const receiverId = "5678";
				const { reaction, user, messageMock } = mockCrownReaction("👑", giverId, receiverId, {
					isBotReacted: true,
					count: APPLY_CROWN_NUM,
				});

				when(messageMock.guildId).thenReturn("1234567890");

				const TEST_CLIENT = await TestDiscordServer.getClient();
				TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

				// 少し待機してハンドラーの処理が完了するのを待つ
				await new Promise((resolve) => setTimeout(resolve, 100));

				// クラウンが作成されていないことを確認
				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(0);
			})();
		});

		/**
		 * Handler #3: Bot ユーザーの投稿への無視
		 * reaction.message.author.bot が true の場合、処理がスキップされることを確認する
		 */
		it("should skip processing when message author is bot", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const giverId = "1234";
				const receiverId = "5678";
				const { reaction, user, messageMock } = mockCrownReaction("👑", giverId, receiverId, {
					isBotMessage: true,
					count: APPLY_CROWN_NUM,
				});

				when(messageMock.guildId).thenReturn("1234567890");

				const TEST_CLIENT = await TestDiscordServer.getClient();
				TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

				await new Promise((resolve) => setTimeout(resolve, 100));

				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(0);
			})();
		});

		/**
		 * Handler #5: content null チェック
		 * reaction.message.content が null の場合、処理がスキップされることを確認する
		 */
		it("should skip processing when message content is null", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const giverId = "1234";
				const receiverId = "5678";
				const { reaction, user, messageMock } = mockCrownReaction("👑", giverId, receiverId, {
					content: null,
					count: APPLY_CROWN_NUM,
				});

				when(messageMock.guildId).thenReturn("1234567890");

				const TEST_CLIENT = await TestDiscordServer.getClient();
				TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

				await new Promise((resolve) => setTimeout(resolve, 100));

				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(0);
			})();
		});

		/**
		 * Handler #6: count null チェック
		 * reaction.count が null の場合、処理がスキップされることを確認する
		 */
		it("should skip processing when reaction count is null", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const giverId = "1234";
				const receiverId = "5678";
				const { reaction, user, messageMock } = mockCrownReaction("👑", giverId, receiverId, {
					count: null,
				});

				when(messageMock.guildId).thenReturn("1234567890");

				const TEST_CLIENT = await TestDiscordServer.getClient();
				TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

				await new Promise((resolve) => setTimeout(resolve, 100));

				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(0);
			})();
		});

		/**
		 * Handler #7: リアクション数の閾値判定
		 * reaction.count が APPLY_CROWN_NUM (10) 未満の場合、処理がスキップされることを確認する
		 */
		it("should skip processing when reaction count is below threshold", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const giverId = "1234";
				const receiverId = "5678";
				const { reaction, user, messageMock } = mockCrownReaction("👑", giverId, receiverId, {
					count: APPLY_CROWN_NUM - 1, // 閾値未満
				});

				when(messageMock.guildId).thenReturn("1234567890");

				const TEST_CLIENT = await TestDiscordServer.getClient();
				TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

				await new Promise((resolve) => setTimeout(resolve, 100));

				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(0);
			})();
		});

		/**
		 * Handler #9: guildId null チェック
		 * reaction.message.guildId が null の場合、処理がスキップされることを確認する
		 */
		it("should skip processing when guildId is null", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const giverId = "1234";
				const receiverId = "5678";
				const { reaction, user, messageMock } = mockCrownReaction("👑", giverId, receiverId, {
					count: APPLY_CROWN_NUM,
					guildId: null,
				});

				const TEST_CLIENT = await TestDiscordServer.getClient();
				TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

				await new Promise((resolve) => setTimeout(resolve, 100));

				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(0);
			})();
		});
	});

	// ===================================
	// Logic (CrownLogic) テスト
	// ===================================
	describe("CrownLogic", () => {
		/**
		 * Logic #1: createCrownIfNotExists - 新規作成
		 * クラウンが存在しない場合、新規作成して成功メッセージを返すことを確認する
		 */
		it("should create new crown when not exists", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const crownLogic = appContainer.get<ICrownLogic>(LogicTypes.CrownLogic);
				const communityId = new CommunityId(1);
				const messageId = new MessageId(1001);
				const crownMessage = new CrownMessage("テストメッセージの内容");
				const crownMessageLink = new CrownMessageLink("https://discord.com/channels/123/456/789");

				const result = await crownLogic.createCrownIfNotExists(communityId, messageId, crownMessage, crownMessageLink);

				// 成功メッセージが返されることを確認
				expect(result).to.not.be.undefined;
				expect(result).to.include("殿堂入り 👑 したよ！");
				expect(result).to.include("テストメッセージの内容");
				expect(result).to.include("https://discord.com/channels/123/456/789");

				// DBにクラウンが作成されていることを確認
				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(1);
			})();
		});

		/**
		 * Logic #2: createCrownIfNotExists - 既存時の undefined
		 * クラウンが既に存在する場合、undefined を返すことを確認する
		 */
		it("should return undefined when crown already exists", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const crownLogic = appContainer.get<ICrownLogic>(LogicTypes.CrownLogic);
				const communityId = new CommunityId(1);
				const messageId = new MessageId(1002);
				const crownMessage = new CrownMessage("テストメッセージの内容");
				const crownMessageLink = new CrownMessageLink("https://discord.com/channels/123/456/789");

				// 1回目の作成
				const result1 = await crownLogic.createCrownIfNotExists(communityId, messageId, crownMessage, crownMessageLink);
				expect(result1).to.not.be.undefined;

				// 2回目の作成（既存）
				const result2 = await crownLogic.createCrownIfNotExists(communityId, messageId, crownMessage, crownMessageLink);
				expect(result2).to.be.undefined;

				// DBにクラウンが1つだけ存在することを確認
				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(1);
			})();
		});

		/**
		 * Logic #4: create メソッド - 成功時のレスポンス
		 * 作成成功時、「殿堂入り 👑 したよ！」を含むメッセージを返すことを確認する
		 */
		it("should return success message with crown emoji on creation", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const crownLogic = appContainer.get<ICrownLogic>(LogicTypes.CrownLogic);
				const communityId = new CommunityId(2);
				const messageId = new MessageId(1003);
				const crownMessage = new CrownMessage("成功メッセージテスト");
				const crownMessageLink = new CrownMessageLink("https://example.com/link");

				const result = await crownLogic.createCrownIfNotExists(communityId, messageId, crownMessage, crownMessageLink);

				expect(result).to.include("殿堂入り 👑 したよ！");
			})();
		});

		/**
		 * Logic #7: レスポンスにメッセージ内容を含む
		 * 返却メッセージに投稿内容（crownMessage）が含まれることを確認する
		 */
		it("should include message content in response", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const crownLogic = appContainer.get<ICrownLogic>(LogicTypes.CrownLogic);
				const communityId = new CommunityId(3);
				const messageId = new MessageId(1004);
				const messageContent = "これは特定のメッセージ内容です";
				const crownMessage = new CrownMessage(messageContent);
				const crownMessageLink = new CrownMessageLink("https://example.com/msg");

				const result = await crownLogic.createCrownIfNotExists(communityId, messageId, crownMessage, crownMessageLink);

				expect(result).to.include(messageContent);
			})();
		});

		/**
		 * Logic #8: レスポンスにリンクを含む
		 * 返却メッセージに投稿リンク（crownMessageLink）が含まれることを確認する
		 */
		it("should include message link in response", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const crownLogic = appContainer.get<ICrownLogic>(LogicTypes.CrownLogic);
				const communityId = new CommunityId(4);
				const messageId = new MessageId(1005);
				const messageLink = "https://discord.com/channels/guild/channel/message";
				const crownMessage = new CrownMessage("テスト");
				const crownMessageLink = new CrownMessageLink(messageLink);

				const result = await crownLogic.createCrownIfNotExists(communityId, messageId, crownMessage, crownMessageLink);

				expect(result).to.include(messageLink);
			})();
		});
	});

	// ===================================
	// Repository (CrownRepositoryImpl) テスト
	// ===================================
	describe("CrownRepositoryImpl", () => {
		/**
		 * Repository #1: findOne - 存在する場合
		 * communityId と messageId で検索して CrownDto を返すことを確認する
		 */
		it("should find existing crown by communityId and messageId", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				// テストデータを直接作成
				await CrownRepositoryImpl.create({
					communityId: 1,
					messageId: 2001,
				});

				const repo = new CrownRepositoryImpl();
				const dto = new CrownDto(new CommunityId(1), new MessageId(2001));

				const result = await repo.findOne(dto);

				expect(result).to.not.be.undefined;
				expect(result?.communityId.getValue()).to.eq(1);
				expect(result?.messageId.getValue()).to.eq(2001);
			})();
		});

		/**
		 * Repository #2: findOne - 存在しない場合
		 * レコードが存在しない場合、undefined を返すことを確認する
		 */
		it("should return undefined when crown not found", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const repo = new CrownRepositoryImpl();
				const dto = new CrownDto(new CommunityId(999), new MessageId(999999));

				const result = await repo.findOne(dto);

				expect(result).to.be.undefined;
			})();
		});

		/**
		 * Repository #3: create - 成功
		 * communityId と messageId でレコードを作成して true を返すことを確認する
		 */
		it("should create crown record and return true", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const repo = new CrownRepositoryImpl();
				const dto = new CrownDto(new CommunityId(5), new MessageId(2002));

				const result = await repo.create(dto);

				expect(result).to.be.true;

				// DBに保存されていることを確認
				const crowns = await CrownRepositoryImpl.findAll({
					where: { communityId: 5, messageId: 2002 },
				});
				expect(crowns.length).to.eq(1);
			})();
		});

		/**
		 * Repository #5: toDto 変換
		 * Model から CrownDto への変換が正しく行われることを確認する
		 */
		it("should correctly convert model to CrownDto", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				await CrownRepositoryImpl.create({
					communityId: 10,
					messageId: 2003,
				});

				const model = await CrownRepositoryImpl.findOne({
					where: { communityId: 10, messageId: 2003 },
				});

				expect(model).to.not.be.null;

				const dto = model?.toDto();

				expect(dto).to.be.instanceOf(CrownDto);
				expect(dto?.communityId.getValue()).to.eq(10);
				expect(dto?.messageId.getValue()).to.eq(2003);
			})();
		});

		/**
		 * Repository #6: 複合主キー
		 * communityId + messageId の複合主キーで一意性が保たれることを確認する
		 */
		it("should maintain uniqueness with composite primary key", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				// 同じ communityId で異なる messageId
				await CrownRepositoryImpl.create({
					communityId: 20,
					messageId: 2004,
				});
				await CrownRepositoryImpl.create({
					communityId: 20,
					messageId: 2005,
				});

				// 異なる communityId で同じ messageId
				await CrownRepositoryImpl.create({
					communityId: 21,
					messageId: 2004,
				});

				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(3);
			})();
		});

		/**
		 * Repository #7: 重複データの拒否
		 * 同一の communityId + messageId で重複挿入ができないことを確認する
		 */
		it("should reject duplicate communityId + messageId combination", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				await CrownRepositoryImpl.create({
					communityId: 30,
					messageId: 2006,
				});

				let error: Error | null = null;
				try {
					await CrownRepositoryImpl.create({
						communityId: 30,
						messageId: 2006,
					});
				} catch (e) {
					error = e as Error;
				}

				expect(error).to.not.be.null;
				expect(error?.name).to.include("Sequelize");
			})();
		});
	});

	// ===================================
	// 統合テスト（End-to-End シナリオ）
	// ===================================
	describe("End-to-End Integration Tests", () => {
		/**
		 * E2E #2: 重複防止：同一メッセージへの複数回リアクション
		 * 同じメッセージに複数回リアクションしても、クラウンは1回しか登録されないことを確認する
		 */
		it("should register crown only once for same message", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const crownLogic = appContainer.get<ICrownLogic>(LogicTypes.CrownLogic);
				const communityId = new CommunityId(100);
				const messageId = new MessageId(3001);
				const crownMessage = new CrownMessage("重複テスト");
				const crownMessageLink = new CrownMessageLink("https://example.com/dup");

				// 1回目
				const result1 = await crownLogic.createCrownIfNotExists(communityId, messageId, crownMessage, crownMessageLink);
				expect(result1).to.not.be.undefined;

				// 2回目（重複）
				const result2 = await crownLogic.createCrownIfNotExists(communityId, messageId, crownMessage, crownMessageLink);
				expect(result2).to.be.undefined;

				// DBに1件のみ存在
				const crowns = await CrownRepositoryImpl.findAll({
					where: { communityId: 100 },
				});
				expect(crowns.length).to.eq(1);
			})();
		});

		/**
		 * E2E #3: 閾値未満：9リアクション時
		 * 9リアクションではクラウンが登録されないことを確認する
		 */
		it("should not register crown with only 9 reactions", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const giverId = "1234";
				const receiverId = "5678";
				const { reaction, user, messageMock } = mockCrownReaction("👑", giverId, receiverId, {
					count: 9, // 閾値未満
				});

				when(messageMock.guildId).thenReturn("1234567890");

				const TEST_CLIENT = await TestDiscordServer.getClient();
				TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

				await new Promise((resolve) => setTimeout(resolve, 100));

				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(0);
			})();
		});

		/**
		 * E2E #4: 自分自身への殿堂入り防止
		 * Bot の投稿に対するリアクションでは殿堂入りしないことを確認する
		 */
		it("should not register crown for bot messages", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const giverId = "1234";
				const receiverId = "5678";
				const { reaction, user, messageMock } = mockCrownReaction("👑", giverId, receiverId, {
					isBotMessage: true,
					count: APPLY_CROWN_NUM,
				});

				when(messageMock.guildId).thenReturn("1234567890");

				const TEST_CLIENT = await TestDiscordServer.getClient();
				TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

				await new Promise((resolve) => setTimeout(resolve, 100));

				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(0);
			})();
		});

		/**
		 * E2E #5: 異なるコミュニティでの独立性
		 * 異なる guildId では別々のクラウンとして管理されることを確認する
		 */
		it("should manage crowns independently for different communities", function (this: Mocha.Context) {
			this.timeout(10_000);

			return (async () => {
				const crownLogic = appContainer.get<ICrownLogic>(LogicTypes.CrownLogic);
				const messageId = new MessageId(3002);
				const crownMessage = new CrownMessage("テスト");
				const crownMessageLink = new CrownMessageLink("https://example.com");

				// Guild A
				const communityIdA = new CommunityId(200);
				const resultA = await crownLogic.createCrownIfNotExists(communityIdA, messageId, crownMessage, crownMessageLink);
				expect(resultA).to.not.be.undefined;

				// Guild B（同じメッセージIDでも別のコミュニティ）
				const communityIdB = new CommunityId(201);
				const resultB = await crownLogic.createCrownIfNotExists(communityIdB, messageId, crownMessage, crownMessageLink);
				expect(resultB).to.not.be.undefined;

				// 両方のコミュニティでクラウンが作成されている
				const crowns = await CrownRepositoryImpl.findAll();
				expect(crowns.length).to.eq(2);

				const crownA = crowns.find((c) => c.communityId === 200);
				const crownB = crowns.find((c) => c.communityId === 201);
				expect(crownA).to.not.be.undefined;
				expect(crownB).to.not.be.undefined;
			})();
		});

		/**
		 * APPLY_CROWN_NUM 定数のテスト
		 * 閾値が正しく 10 に設定されていることを確認する
		 */
		it("should have APPLY_CROWN_NUM set to 10", () => {
			expect(APPLY_CROWN_NUM).to.eq(10);
		});

		/**
		 * CrownDto の構造テスト
		 * CrownDto が正しいプロパティを持つことを確認する
		 */
		it("should create CrownDto with correct properties", () => {
			const communityId = new CommunityId(1);
			const messageId = new MessageId(3003);
			const dto = new CrownDto(communityId, messageId);

			expect(dto.communityId).to.eq(communityId);
			expect(dto.messageId).to.eq(messageId);
			expect(dto.communityId.getValue()).to.eq(1);
			expect(dto.messageId.getValue()).to.eq(3003);
		});
	});
});
