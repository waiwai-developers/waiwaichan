import { ColumnDto } from "@/src/entities/dto/Column";
import { ChannelBatchStatus } from "@/src/entities/vo/ChannelBatchStatus";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { ColumnId } from "@/src/entities/vo/ColumnId";
import { ColumnName } from "@/src/entities/vo/ColumnName";
import { CommunityBatchStatus } from "@/src/entities/vo/CommunityBatchStatus";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { MessageBatchStatus } from "@/src/entities/vo/MessageBatchStatus";
import { MessageChannelId } from "@/src/entities/vo/MessageChannelId";
import { MessageClientId } from "@/src/entities/vo/MessageClientId";
import { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import { MessageId } from "@/src/entities/vo/MessageId";
import { MessageUserId } from "@/src/entities/vo/MessageUserId";
import { UserBatchStatus } from "@/src/entities/vo/UserBatchStatus";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserId } from "@/src/entities/vo/UserId";
import { DataDeletionCircularHandler } from "@/src/handlers/discord.js/events/DataDeletionCircularHandler";
import type { DataDeletionCircularLogic } from "@/src/logics/DataDeletionCircularLogic";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import { ChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/ChannelRepositoryImpl";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { DataDeletionCircularImpl } from "@/src/repositories/sequelize-mysql/DataDeletionCircularImpl";
import { MessageRepositoryImpl } from "@/src/repositories/sequelize-mysql/MessageRepositoryImpl";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
import { expect } from "chai";
import { getOptions } from "sequelize-typescript";
import { anything, verify, when } from "ts-mockito";
import {
	createFakeClient,
	executeAndVerifyDeletionArguments,
	mockConnectorModels,
	mockConsoleError,
	setupChannelDeleteArgumentCapture,
	setupDeletionOrderTracking,
	setupDeletionOrderTrackingWithMessages,
	setupHandlerMocks,
	setupMessageDeleteByChannelIdArgumentCapture,
	setupMessageDeleteByCommunityIdArgumentCapture,
	setupMessageDeleteByUserIdArgumentCapture,
	setupUserDeleteArgumentCapture,
	testRepositoryFindDeletionTargets,
	testRepositoryNotInCondition,
	testRepositorySingleColumnCondition,
	testRepositoryUpdateBatchStatus,
} from "./DataDeletionTestHelpers";

describe("CommunityAndUserDeleteHandler integration tests", () => {
	let communityLogicMock: ICommunityLogic;
	let userLogicMock: IUserLogic;
	let channelLogicMock: IChannelLogic;
	let messageLogicMock: IMessageLogic;
	let dataDeletionLogicMock: DataDeletionCircularLogic;
	let cleanupHandlerMocks: () => void;

	beforeEach(() => {
		const mocks = setupHandlerMocks();
		communityLogicMock = mocks.communityLogicMock;
		userLogicMock = mocks.userLogicMock;
		channelLogicMock = mocks.channelLogicMock;
		messageLogicMock = mocks.messageLogicMock;
		dataDeletionLogicMock = mocks.dataDeletionLogicMock;
		cleanupHandlerMocks = mocks.cleanup;
	});

	afterEach(() => {
		cleanupHandlerMocks();
	});

	/**
	 * A. Guild内ユーザー削除
	 */
	describe("A. Guild内ユーザー削除", () => {
		/**
		 * [Communityなし] DBにCommunityが存在しない場合は削除が行われない
		 * - deleteNotBelongByCommunityIdAndClientIdsが呼ばれないことを検証
		 */
		it("Communityが存在しない場合は削除をスキップする", async () => {
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(undefined);
			const client = createFakeClient([{ id: "100", memberIds: ["200"], channelIds: ["300"] }]);
			await DataDeletionCircularHandler(client as any);
			verify((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())).never();
		});

		/**
		 * [メンバー空] Guild内メンバーが0件の場合は削除が行われない
		 * - deleteNotBelongByCommunityIdAndClientIdsが呼ばれないことを検証
		 */
		it("メンバー一覧が空の場合は削除をスキップする", async () => {
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(new CommunityId(1));
			const client = createFakeClient([{ id: "100", memberIds: [], channelIds: ["300"] }]);
			await DataDeletionCircularHandler(client as any);
			verify((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())).never();
		});

		/**
		 * [削除対象] memberIdsに含まれないユーザーだけが削除対象になる
		 * - deleteNotBelongByCommunityIdAndClientIdsの引数が正しいことを検証
		 */
		it("memberIdsがUser削除に渡される", async () => {
			const communityId = new CommunityId(10);
			const capture = setupUserDeleteArgumentCapture(userLogicMock);
			(when((channelLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenResolve(true);

			const client = createFakeClient([{ id: "100", memberIds: ["200", "201"], channelIds: ["300"] }]);
			await executeAndVerifyDeletionArguments(communityLogicMock, communityId, client, capture, ["200", "201"]);

			verify((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())).once();
		});

		/**
		 * [Repository条件] communityIdとNOT IN条件が適用される
		 * - deleteNotBelongByCommunityIdAndClientIdsのwhere条件を検証
		 */
		it("UserRepositoryImpl.deleteNotBelongByCommunityIdAndClientIdsはcommunityIdとNOT IN条件を持つ", async () => {
			await testRepositoryNotInCondition(
				UserRepositoryImpl,
				"destroy",
				(repo) =>
					repo.deleteNotBelongByCommunityIdAndClientIds(new UserCommunityId(12), [new UserClientId(BigInt(99)), new UserClientId(BigInt(100))]),
				{
					communityId: 12,
					clientIds: [BigInt(99), BigInt(100)],
				},
			);
		});
	});

	/**
	 * A2. Guild内Channel削除
	 */
	describe("A2. Guild内Channel削除", () => {
		/**
		 * [Channel空] Guild内Channelが0件の場合は削除が行われない
		 * - deleteNotBelongByCommunityIdAndClientIdsが呼ばれないことを検証
		 */
		it("Channel一覧が空の場合は削除をスキップする", async () => {
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(new CommunityId(1));
			(when((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenResolve(true);
			const client = createFakeClient([{ id: "100", memberIds: ["200"], channelIds: [] }]);
			await DataDeletionCircularHandler(client as any);
			verify((channelLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())).never();
		});

		/**
		 * [削除対象] channelIdsに含まれないChannelだけが削除対象になる
		 * - deleteNotBelongByCommunityIdAndClientIdsの引数が正しいことを検証
		 */
		it("channelIdsがChannel削除に渡される", async () => {
			const communityId = new CommunityId(10);
			const capture = setupChannelDeleteArgumentCapture(channelLogicMock);
			(when((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenResolve(true);

			const client = createFakeClient([{ id: "100", memberIds: ["200"], channelIds: ["300", "301"] }]);
			await executeAndVerifyDeletionArguments(communityLogicMock, communityId, client, capture, ["300", "301"]);

			verify((channelLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())).once();
		});

		/**
		 * [Repository条件] communityIdとNOT IN条件が適用される
		 * - deleteNotBelongByCommunityIdAndClientIdsのwhere条件を検証
		 */
		it("ChannelRepositoryImpl.deleteNotBelongByCommunityIdAndClientIdsはcommunityIdとNOT IN条件を持つ", async () => {
			await testRepositoryNotInCondition(
				ChannelRepositoryImpl,
				"destroy",
				(repo) =>
					repo.deleteNotBelongByCommunityIdAndClientIds(new ChannelCommunityId(12), [
						new ChannelClientId(BigInt(99)),
						new ChannelClientId(BigInt(100)),
					]),
				{
					communityId: 12,
					clientIds: [BigInt(99), BigInt(100)],
				},
			);
		});
	});

	/**
	 * B. Bot未所属Community削除
	 */
	describe("B. Bot未所属Community削除", () => {
		/**
		 * [削除順] User削除→Channel削除→Community削除の順で実行される
		 * - 削除順序がUser→Channel→Communityであることを検証
		 */
		it("User削除→Channel削除→Community削除の順で実行される", async () => {
			(when((communityLogicMock as any).getNotExistClientId(anything(), anything())) as any).thenResolve([new CommunityClientId(BigInt("200"))]);
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(new CommunityId(30));
			const tracker = setupDeletionOrderTracking(userLogicMock, channelLogicMock, communityLogicMock);

			const client = createFakeClient([]);
			await DataDeletionCircularHandler(client as any);

			expect(tracker.getCallOrder()).to.deep.equal(["deleteUsers", "deleteChannels", "deleteCommunity"]);
		});

		/**
		 * [Communityなし] CommunityIdが取得できない場合は削除されない
		 * - deletebyCommunityId / deleteが呼ばれないことを検証
		 */
		it("CommunityIdが取得できない場合は削除をスキップする", async () => {
			(when((communityLogicMock as any).getNotExistClientId(anything(), anything())) as any).thenResolve([new CommunityClientId(BigInt("200"))]);
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(undefined);

			const client = createFakeClient([]);
			await DataDeletionCircularHandler(client as any);

			verify((userLogicMock as any).deletebyCommunityId(anything())).never();
			verify((channelLogicMock as any).deletebyCommunityId(anything())).never();
			verify((communityLogicMock as any).delete(anything())).never();
		});

		/**
		 * [Repository条件] getNotExistClientIdがNOT IN条件で検索する
		 * - categoryType / clientIdの条件を検証
		 */
		it("CommunityRepositoryImpl.getNotExistClientIdはNOT IN条件で検索する", async () => {
			await testRepositoryNotInCondition(
				CommunityRepositoryImpl,
				"findAll",
				(repo) => repo.getNotExistClientId(CommunityCategoryType.Discord, [new CommunityClientId(BigInt(1)), new CommunityClientId(BigInt(2))]),
				{
					categoryType: CommunityCategoryType.Discord.getValue(),
					clientIds: [BigInt(1), BigInt(2)],
				},
			);
		});
	});

	/**
	 * C/D. 論理削除ユーザー・Community・Channelの関連削除
	 */
	describe("C/D. 論理削除ユーザー・Community・Channelの関連削除", () => {
		/**
		 * [削除対象ユーザー] batchStatus=Yet && deletedAt!=null のみ取得する
		 * - findDeletionTargetsByBatchStatusAndDeletedAtのwhere条件を検証
		 */
		it("UserRepositoryImpl.findDeletionTargetsByBatchStatusAndDeletedAtはbatchStatus=YetとdeletedAt!=nullのみ取得する", async () => {
			await testRepositoryFindDeletionTargets(UserRepositoryImpl, UserBatchStatus.Yet.getValue());
		});

		/**
		 * [削除対象Community] batchStatus=Yet && deletedAt!=null のみ取得する
		 * - findDeletionTargetsByBatchStatusAndDeletedAtのwhere条件を検証
		 */
		it("CommunityRepositoryImpl.findDeletionTargetsByBatchStatusAndDeletedAtはbatchStatus=YetとdeletedAt!=nullのみ取得する", async () => {
			await testRepositoryFindDeletionTargets(CommunityRepositoryImpl, CommunityBatchStatus.Yet.getValue());
		});

		/**
		 * [削除対象Channel] batchStatus=Yet && deletedAt!=null のみ取得する
		 * - findDeletionTargetsByBatchStatusAndDeletedAtのwhere条件を検証
		 */
		it("ChannelRepositoryImpl.findDeletionTargetsByBatchStatusAndDeletedAtはbatchStatus=YetとdeletedAt!=nullのみ取得する", async () => {
			await testRepositoryFindDeletionTargets(ChannelRepositoryImpl, ChannelBatchStatus.Yet.getValue());
		});

		/**
		 * [関連削除] 対象カラムを持つモデルのみ削除される
		 * - getAttributesの結果に応じてdestroyが呼ばれることを検証
		 */
		it("DataDeletionCircularImplは対象カラムを持つモデルを削除する", async () => {
			const destroyCalls: number[] = [];
			const targetModel = {
				getAttributes: () => ({ userId: true }),
				destroy: async () => {
					destroyCalls.push(1);
					return 0;
				},
			};
			const nonTargetModel = {
				getAttributes: () => ({ other: true }),
				destroy: async () => 1,
			};

			const cleanup = mockConnectorModels([targetModel, nonTargetModel], []);

			const repo = new DataDeletionCircularImpl();
			const result = await repo.deleteRecordInRelatedTable(new ColumnDto(ColumnName.user, new ColumnId(1)));

			expect(result).to.equal(true);
			expect(destroyCalls.length).to.equal(1);

			cleanup();
		});

		/**
		 * [関連削除 - channel] 対象カラムを持つモデルのみ削除される
		 * - getAttributesの結果に応じてdestroyが呼ばれることを検証
		 */
		it("DataDeletionCircularImplはchannelカラムを持つモデルを削除する", async () => {
			const destroyCalls: number[] = [];
			const targetModel = {
				getAttributes: () => ({ channelId: true }),
				destroy: async () => {
					destroyCalls.push(1);
					return 0;
				},
			};
			const nonTargetModel = {
				getAttributes: () => ({ other: true }),
				destroy: async () => 1,
			};

			const cleanup = mockConnectorModels([targetModel, nonTargetModel], []);

			const repo = new DataDeletionCircularImpl();
			const result = await repo.deleteRecordInRelatedTable(new ColumnDto(ColumnName.channel, new ColumnId(1)));

			expect(result).to.equal(true);
			expect(destroyCalls.length).to.equal(1);

			cleanup();
		});

		/**
		 * [関連削除] 対象モデルが0件でも成功扱いになる
		 * - deleteRecordInRelatedTableがtrueを返すことを検証
		 */
		it("DataDeletionCircularImplは対象モデルが0件でも成功扱いにする", async () => {
			const cleanup = mockConnectorModels(
				[
					{
						getAttributes: () => ({ other: true }),
						destroy: async () => 1,
					},
				],
				[],
			);

			const repo = new DataDeletionCircularImpl();
			const result = await repo.deleteRecordInRelatedTable(new ColumnDto(ColumnName.community, new ColumnId(2)));

			expect(result).to.equal(true);

			cleanup();
		});

		/**
		 * [例外処理] 例外発生時はfalseを返しログを出力する
		 * - console.errorが呼ばれることを検証
		 */
		it("DataDeletionCircularImplは例外時にfalseを返しログを出力する", async () => {
			let capturedError = "";

			const modelsCleanup = mockConnectorModels(
				[
					{
						getAttributes: () => ({ userId: true }),
						destroy: async () => {
							throw new Error("destroy error");
						},
					},
				],
				[],
			);

			const consoleCleanup = mockConsoleError((message) => {
				capturedError = message;
			});

			const repo = new DataDeletionCircularImpl();
			const result = await repo.deleteRecordInRelatedTable(new ColumnDto(ColumnName.user, new ColumnId(3)));

			expect(result).to.equal(false);
			expect(capturedError).to.include("Error in deleteRecordInRelatedTable");

			consoleCleanup();
			modelsCleanup();
		});
	});

	/**
	 * E. DB論理削除/バッチ状態
	 */
	describe("E. DB論理削除/バッチ状態", () => {
		/**
		 * [論理削除] paranoid=trueで論理削除が有効
		 * - Community/User/Channelのparanoid設定を検証
		 */
		it("Community/User/Channelの削除はparanoid=trueで設定されている", () => {
			// @Tableデコレータで設定されたオプションを取得
			expect(getOptions(CommunityRepositoryImpl.prototype)?.paranoid).to.equal(true);
			expect(getOptions(UserRepositoryImpl.prototype)?.paranoid).to.equal(true);
			expect(getOptions(ChannelRepositoryImpl.prototype)?.paranoid).to.equal(true);
		});

		/**
		 * [バッチ更新] deletedAtの有無に関わらずbatchStatusを更新する
		 * - updatebatchStatusがparanoid:falseで更新することを検証
		 */
		it("updatebatchStatusはparanoid=falseで更新する", async () => {
			await testRepositoryUpdateBatchStatus(CommunityRepositoryImpl, new CommunityId(1), CommunityBatchStatus.Yet.getValue());
			await testRepositoryUpdateBatchStatus(UserRepositoryImpl, new UserId(2), UserBatchStatus.Yet.getValue());
			await testRepositoryUpdateBatchStatus(ChannelRepositoryImpl, new ChannelId(3), ChannelBatchStatus.Yet.getValue());
		});
	});

	/**
	 * F. Message削除（Channel関連）
	 */
	describe("F. Message削除（Channel関連）", () => {
		/**
		 * [削除対象] 削除されたChannelに関連するMessagesが削除される
		 * - deleteByChannelIdAndReturnClientIdsが呼ばれることを検証
		 */
		it("削除されたChannelのMessagesが削除される", async () => {
			const communityId = new CommunityId(10);
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(communityId);
			(when((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenResolve(true);
			(when((channelLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenResolve(true);

			// Channel削除対象を設定
			const deletedChannelId = new ChannelId(50);
			(when((channelLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()) as any).thenResolve([{ id: deletedChannelId }]);

			const capture = setupMessageDeleteByChannelIdArgumentCapture(messageLogicMock);

			const client = createFakeClient([{ id: "100", memberIds: ["200"], channelIds: ["300"] }]);
			await DataDeletionCircularHandler(client as any);

			const capturedChannelIds = capture.getChannelIds();
			expect(capturedChannelIds.length).to.be.greaterThan(0);
			expect(capturedChannelIds[0].getValue()).to.equal(deletedChannelId.getValue());
		});

		/**
		 * [Repository条件] deleteByChannelIdAndReturnClientIdsはchannelIdで検索・削除する
		 * - channelIdでfindAll→destroyが実行されることを検証
		 */
		it("MessageRepositoryImpl.deleteByChannelIdAndReturnClientIdsはchannelIdで検索する", async () => {
			await testRepositorySingleColumnCondition(
				MessageRepositoryImpl,
				"findAll",
				(repo) => repo.deleteByChannelIdAndReturnClientIds(new MessageChannelId(42)),
				{
					columnName: "channelId",
					columnValue: 42,
				},
			);
		});
	});

	/**
	 * G. Message削除（User関連）
	 */
	describe("G. Message削除（User関連）", () => {
		/**
		 * [削除対象] 削除されたUserに関連するMessagesが削除される
		 * - deleteByUserIdAndReturnClientIdsが呼ばれることを検証
		 */
		it("削除されたUserのMessagesが削除される", async () => {
			const communityId = new CommunityId(10);
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(communityId);
			(when((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenResolve(true);
			(when((channelLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenResolve(true);

			// User削除対象を設定
			const deletedUserId = new UserId(60);
			(when((userLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()) as any).thenResolve([{ id: deletedUserId }]);

			const capture = setupMessageDeleteByUserIdArgumentCapture(messageLogicMock);

			const client = createFakeClient([{ id: "100", memberIds: ["200"], channelIds: ["300"] }]);
			await DataDeletionCircularHandler(client as any);

			const capturedUserIds = capture.getUserIds();
			expect(capturedUserIds.length).to.be.greaterThan(0);
			expect(capturedUserIds[0].getValue()).to.equal(deletedUserId.getValue());
		});

		/**
		 * [Repository条件] deleteByUserIdAndReturnClientIdsはuserIdで検索・削除する
		 * - userIdでfindAll→destroyが実行されることを検証
		 */
		it("MessageRepositoryImpl.deleteByUserIdAndReturnClientIdsはuserIdで検索する", async () => {
			await testRepositorySingleColumnCondition(
				MessageRepositoryImpl,
				"findAll",
				(repo) => repo.deleteByUserIdAndReturnClientIds(new MessageUserId(55)),
				{
					columnName: "userId",
					columnValue: 55,
				},
			);
		});
	});

	/**
	 * H. Message削除（Community関連）
	 */
	describe("H. Message削除（Community関連）", () => {
		/**
		 * [削除対象] Bot未所属Community削除時にCommunityに関連するMessagesが削除される
		 * - deletebyCommunityIdが呼ばれることを検証
		 */
		it("Bot未所属Community削除時にCommunityのMessagesが削除される", async () => {
			(when((communityLogicMock as any).getNotExistClientId(anything(), anything())) as any).thenResolve([new CommunityClientId(BigInt("200"))]);
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(new CommunityId(30));
			(when((userLogicMock as any).deletebyCommunityId(anything())) as any).thenResolve(true);
			(when((channelLogicMock as any).deletebyCommunityId(anything())) as any).thenResolve(true);
			(when((communityLogicMock as any).delete(anything())) as any).thenResolve(true);

			const capture = setupMessageDeleteByCommunityIdArgumentCapture(messageLogicMock);

			const client = createFakeClient([]);
			await DataDeletionCircularHandler(client as any);

			const capturedCommunityIds = capture.getCommunityIds();
			expect(capturedCommunityIds.length).to.be.greaterThan(0);
			expect(capturedCommunityIds[0].getValue()).to.equal(30);
		});

		/**
		 * [Repository条件] deletebyCommunityIdはcommunityIdで削除する
		 * - communityIdでdestroyが実行されることを検証
		 */
		it("MessageRepositoryImpl.deletebyCommunityIdはcommunityIdで削除する", async () => {
			await testRepositorySingleColumnCondition(
				MessageRepositoryImpl,
				"destroy",
				(repo) => repo.deletebyCommunityId(new MessageCommunityId(77)),
				{
					columnName: "communityId",
					columnValue: 77,
				},
			);
		});

		/**
		 * [Repository条件] deleteNotBelongByCommunityIdAndClientIdsはcommunityIdとNOT IN条件を持つ
		 * - deleteNotBelongByCommunityIdAndClientIdsのwhere条件を検証
		 */
		it("MessageRepositoryImpl.deleteNotBelongByCommunityIdAndClientIdsはcommunityIdとNOT IN条件を持つ", async () => {
			await testRepositoryNotInCondition(
				MessageRepositoryImpl,
				"destroy",
				(repo) =>
					repo.deleteNotBelongByCommunityIdAndClientIds(new MessageCommunityId(12), [
						new MessageClientId(BigInt(99)),
						new MessageClientId(BigInt(100)),
					]),
				{
					communityId: 12,
					clientIds: [BigInt(99), BigInt(100)],
				},
			);
		});
	});

	/**
	 * I. 論理削除Messageの関連削除
	 */
	describe("I. 論理削除Messageの関連削除", () => {
		/**
		 * [削除対象Message] batchStatus=Yet && deletedAt!=null のみ取得する
		 * - findDeletionTargetsByBatchStatusAndDeletedAtのwhere条件を検証
		 */
		it("MessageRepositoryImpl.findDeletionTargetsByBatchStatusAndDeletedAtはbatchStatus=YetとdeletedAt!=nullのみ取得する", async () => {
			await testRepositoryFindDeletionTargets(MessageRepositoryImpl, MessageBatchStatus.Yet.getValue());
		});

		/**
		 * [関連削除 - message] messageカラムを持つモデルのみ削除される
		 * - getAttributesの結果に応じてdestroyが呼ばれることを検証
		 */
		it("DataDeletionCircularImplはmessageカラムを持つモデルを削除する", async () => {
			const destroyCalls: number[] = [];
			const targetModel = {
				getAttributes: () => ({ messageId: true }),
				destroy: async () => {
					destroyCalls.push(1);
					return 0;
				},
			};
			const nonTargetModel = {
				getAttributes: () => ({ other: true }),
				destroy: async () => 1,
			};

			const cleanup = mockConnectorModels([targetModel, nonTargetModel], []);

			const repo = new DataDeletionCircularImpl();
			const result = await repo.deleteRecordInRelatedTable(new ColumnDto(ColumnName.message, new ColumnId(1)));

			expect(result).to.equal(true);
			expect(destroyCalls.length).to.equal(1);

			cleanup();
		});

		/**
		 * [対象なし] 対象Messageが0件でも成功扱いになる
		 * - deleteRecordInRelatedTableがtrueを返すことを検証
		 */
		it("DataDeletionCircularImplはMessage対象モデルが0件でも成功扱いにする", async () => {
			const cleanup = mockConnectorModels(
				[
					{
						getAttributes: () => ({ other: true }),
						destroy: async () => 1,
					},
				],
				[],
			);

			const repo = new DataDeletionCircularImpl();
			const result = await repo.deleteRecordInRelatedTable(new ColumnDto(ColumnName.message, new ColumnId(2)));

			expect(result).to.equal(true);

			cleanup();
		});
	});

	/**
	 * J. Message論理削除/バッチ状態
	 */
	describe("J. Message論理削除/バッチ状態", () => {
		/**
		 * [論理削除] paranoid=trueで論理削除が有効
		 * - Messageのparanoid設定を検証
		 */
		it("Messageの削除はparanoid=trueで設定されている", () => {
			// @Tableデコレータで設定されたオプションを取得
			expect(getOptions(MessageRepositoryImpl.prototype)?.paranoid).to.equal(true);
		});

		/**
		 * [バッチ更新] deletedAtの有無に関わらずbatchStatusを更新する
		 * - updatebatchStatusがparanoid:falseで更新することを検証
		 */
		it("MessageRepositoryImpl.updatebatchStatusはparanoid=falseで更新する", async () => {
			await testRepositoryUpdateBatchStatus(MessageRepositoryImpl, new MessageId(4), MessageBatchStatus.Yet.getValue());
		});
	});

	/**
	 * K. Bot未所属Community削除時の削除順序（Message含む）
	 */
	describe("K. Bot未所属Community削除時の削除順序（Message含む）", () => {
		/**
		 * [削除順] User削除→UserのMessages検索→Channel削除→ChannelのMessages検索→CommunityのMessages削除→Community削除の順で実行される
		 * - 削除順序が正しいことを検証
		 */
		it("User削除→Channel削除→CommunityのMessages削除→Community削除の順で実行される", async () => {
			(when((communityLogicMock as any).getNotExistClientId(anything(), anything())) as any).thenResolve([new CommunityClientId(BigInt("200"))]);
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(new CommunityId(30));
			const tracker = setupDeletionOrderTrackingWithMessages(userLogicMock, channelLogicMock, messageLogicMock, communityLogicMock);

			const client = createFakeClient([]);
			await DataDeletionCircularHandler(client as any);

			const callOrder = tracker.getCallOrder();
			// User削除がChannel削除より先
			const userDeleteIndex = callOrder.indexOf("deleteUsers");
			const channelDeleteIndex = callOrder.indexOf("deleteChannels");
			const messageDeleteIndex = callOrder.indexOf("deleteMessagesForCommunity");
			const communityDeleteIndex = callOrder.indexOf("deleteCommunity");

			expect(userDeleteIndex).to.be.lessThan(channelDeleteIndex);
			expect(channelDeleteIndex).to.be.lessThan(messageDeleteIndex);
			expect(messageDeleteIndex).to.be.lessThan(communityDeleteIndex);
		});
	});
});
