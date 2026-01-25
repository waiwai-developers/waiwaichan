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
import { UserBatchStatus } from "@/src/entities/vo/UserBatchStatus";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserId } from "@/src/entities/vo/UserId";
import { DataDeletionCircularHandler } from "@/src/handlers/discord.js/events/DataDeletionCircularHandler";
import type { DataDeletionCircularLogic } from "@/src/logics/DataDeletionCircularLogic";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import { ChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/ChannelRepositoryImpl";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { DataDeletionCircularImpl } from "@/src/repositories/sequelize-mysql/DataDeletionCircularImpl";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
import { expect } from "chai";
import { anything, verify, when } from "ts-mockito";
import {
	createFakeClient,
	executeAndVerifyDeletionArguments,
	mockConnectorModels,
	mockConsoleError,
	setupChannelDeleteArgumentCapture,
	setupDeletionOrderTracking,
	setupHandlerMocks,
	setupUserDeleteArgumentCapture,
	testRepositoryFindDeletionTargets,
	testRepositoryNotInCondition,
	testRepositoryUpdateBatchStatus,
} from "./DataDeletionTestHelpers";

describe("CommunityAndUserDeleteHandler integration tests", () => {
	let communityLogicMock: ICommunityLogic;
	let userLogicMock: IUserLogic;
	let channelLogicMock: IChannelLogic;
	let dataDeletionLogicMock: DataDeletionCircularLogic;
	let cleanupHandlerMocks: () => void;

	beforeEach(() => {
		const mocks = setupHandlerMocks();
		communityLogicMock = mocks.communityLogicMock;
		userLogicMock = mocks.userLogicMock;
		channelLogicMock = mocks.channelLogicMock;
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
				(repo) => repo.deleteNotBelongByCommunityIdAndClientIds(
					new UserCommunityId(12),
					[new UserClientId(BigInt(99)), new UserClientId(BigInt(100))],
				),
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
				(repo) => repo.deleteNotBelongByCommunityIdAndClientIds(
					new ChannelCommunityId(12),
					[new ChannelClientId(BigInt(99)), new ChannelClientId(BigInt(100))],
				),
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
				(repo) => repo.getNotExistClientId(
					CommunityCategoryType.Discord,
					[new CommunityClientId(BigInt(1)), new CommunityClientId(BigInt(2))],
				),
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
			const cleanup = mockConnectorModels([
				{
					getAttributes: () => ({ other: true }),
					destroy: async () => 1,
				},
			], []);

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

			const modelsCleanup = mockConnectorModels([
				{
					getAttributes: () => ({ userId: true }),
					destroy: async () => {
						throw new Error("destroy error");
					},
				},
			], []);

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
			expect((CommunityRepositoryImpl as any).options?.paranoid).to.equal(true);
			expect((UserRepositoryImpl as any).options?.paranoid).to.equal(true);
			expect((ChannelRepositoryImpl as any).options?.paranoid).to.equal(true);
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
});
