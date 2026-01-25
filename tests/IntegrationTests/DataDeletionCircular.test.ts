import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
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
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { MysqlSchedulerConnector } from "@/src/repositories/sequelize-mysql/MysqlSchedulerConnector";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
import { schedulerContainer } from "@/src/scheduler.di.config";
import { expect } from "chai";
import { Op } from "sequelize";
import { anything, instance, mock, verify, when } from "ts-mockito";

// ===================================
// Helper Functions: Mock Creation
// ===================================

const createMembers = (ids: string[]) => {
	const members = new Map<string, { user: { id: string } }>();
	ids.forEach((id) => members.set(id, { user: { id } }));
	return members;
};

const createChannels = (ids: string[]) => {
	const channels = new Map<string, { id: string }>();
	ids.forEach((id) => channels.set(id, { id }));
	return channels;
};

const createFakeClient = (guilds: { id: string; memberIds: string[]; channelIds: string[] }[]) => {
	const guildStore = new Map(
		guilds.map((guild) => [
			guild.id,
			{
				id: guild.id,
				members: {
					fetch: async () => createMembers(guild.memberIds),
				},
				channels: {
					fetch: async () => createChannels(guild.channelIds),
				},
			},
		]),
	);
	const guildEntries = guilds.map((guild) => ({ id: guild.id }));
	const collection = {
		values: () => guildEntries.values(),
		map: (mapper: (g: { id: string }) => any) => guildEntries.map(mapper),
	};
	return {
		guilds: {
			cache: collection,
			fetch: async (id: string) => guildStore.get(id),
		},
	};
};

/**
 * Repositoryメソッドをモック化し、where条件をキャプチャするヘルパー
 * @param repository モック対象のRepository
 * @param methodName モック対象のメソッド名
 * @param captureCallback where条件をキャプチャするコールバック
 * @returns クリーンアップ関数
 */
const mockRepositoryMethod = <T extends Record<string, any>>(
	repository: T,
	methodName: keyof T,
	captureCallback: (options: any) => void,
): (() => void) => {
	const originalMethod = repository[methodName];
	(repository as any)[methodName] = (optionsOrValues: any, options?: any) => {
		// update メソッドの場合は第2引数、それ以外は第1引数
		const targetOptions = options !== undefined ? options : optionsOrValues;
		captureCallback(targetOptions);
		// メソッドに応じた適切な戻り値を返す
		if (methodName === "update") {
			return Promise.resolve([1]);
		}
		if (methodName === "destroy") {
			return Promise.resolve(1);
		}
		if (methodName === "findAll") {
			return Promise.resolve([]);
		}
		return Promise.resolve([]);
	};
	return () => {
		(repository as any)[methodName] = originalMethod;
	};
};

/**
 * MysqlConnector/MysqlSchedulerConnectorのmodelsをモック化するヘルパー
 * @param connectorModels MysqlConnector用のモデル配列
 * @param schedulerModels MysqlSchedulerConnector用のモデル配列
 * @returns クリーンアップ関数
 */
const mockConnectorModels = (
	connectorModels: any[],
	schedulerModels: any[] = [],
): (() => void) => {
	const originalConnectorModels = MysqlConnector.models;
	const originalSchedulerModels = MysqlSchedulerConnector.models;
	(MysqlConnector as any).models = connectorModels;
	(MysqlSchedulerConnector as any).models = schedulerModels;
	return () => {
		(MysqlConnector as any).models = originalConnectorModels;
		(MysqlSchedulerConnector as any).models = originalSchedulerModels;
	};
};

/**
 * console.errorをモック化するヘルパー
 * @param captureCallback エラーメッセージをキャプチャするコールバック
 * @returns クリーンアップ関数
 */
const mockConsoleError = (captureCallback: (message: string) => void): (() => void) => {
	const originalConsoleError = console.error;
	console.error = (message?: any) => {
		captureCallback(String(message));
	};
	return () => {
		console.error = originalConsoleError;
	};
};

describe("CommunityAndUserDeleteHandler integration tests", () => {
	let communityLogicMock: ICommunityLogic;
	let userLogicMock: IUserLogic;
	let channelLogicMock: IChannelLogic;
	let dataDeletionLogicMock: DataDeletionCircularLogic;
	let originalGet: typeof schedulerContainer.get;

	beforeEach(() => {
		communityLogicMock = mock<ICommunityLogic>();
		userLogicMock = mock<IUserLogic>();
		channelLogicMock = mock<IChannelLogic>();
		dataDeletionLogicMock = mock<DataDeletionCircularLogic>();
		originalGet = schedulerContainer.get.bind(schedulerContainer);
		(schedulerContainer as any).get = (token: symbol) => {
			if (token === LogicTypes.CommunityLogic) {
				return instance(communityLogicMock);
			}
			if (token === LogicTypes.UserLogic) {
				return instance(userLogicMock);
			}
			if (token === LogicTypes.ChannelLogic) {
				return instance(channelLogicMock);
			}
			if (token === LogicTypes.dataDeletionCircularLogic) {
				return instance(dataDeletionLogicMock);
			}
			return originalGet(token);
		};
		when((communityLogicMock as any).getNotExistClientId(anything(), anything()) as any).thenReturn(Promise.resolve([] as CommunityClientId[]));
		when((userLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()).thenResolve([] as any);
		when((communityLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()).thenResolve([] as any);
		when((channelLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()).thenResolve([] as any);
	});

	afterEach(() => {
		(schedulerContainer as any).get = originalGet;
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
			let capturedCommunityId: UserCommunityId | null = null;
			let capturedClientIds: UserClientId[] = [];
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(communityId);
			(when((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenCall(
				(cid: UserCommunityId, ids: UserClientId[]) => {
					capturedCommunityId = cid;
					capturedClientIds = ids;
					return Promise.resolve(true);
				},
			);
			(when((channelLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenResolve(true);

			const client = createFakeClient([{ id: "100", memberIds: ["200", "201"], channelIds: ["300"] }]);
			await DataDeletionCircularHandler(client as any);

			expect((capturedCommunityId as UserCommunityId | null)?.getValue()).to.equal(communityId.getValue());
			expect(capturedClientIds.map((c) => c.getValue())).to.deep.equal([BigInt("200"), BigInt("201")]);
			verify((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())).once();
		});

		/**
		 * [Repository条件] communityIdとNOT IN条件が適用される
		 * - deleteNotBelongByCommunityIdAndClientIdsのwhere条件を検証
		 */
		it("UserRepositoryImpl.deleteNotBelongByCommunityIdAndClientIdsはcommunityIdとNOT IN条件を持つ", async () => {
			let receivedWhere: any = null;
			const cleanup = mockRepositoryMethod(UserRepositoryImpl, "destroy", (options) => {
				receivedWhere = options.where;
			});

			const repo = new UserRepositoryImpl();
			await repo.deleteNotBelongByCommunityIdAndClientIds(new UserCommunityId(12), [new UserClientId(BigInt(99)), new UserClientId(BigInt(100))]);

			expect(receivedWhere.communityId).to.equal(12);
			expect(receivedWhere.clientId[Op.notIn]).to.deep.equal([BigInt(99), BigInt(100)]);

			cleanup();
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
			let capturedCommunityId: ChannelCommunityId | null = null;
			let capturedClientIds: ChannelClientId[] = [];
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(communityId);
			(when((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenResolve(true);
			(when((channelLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenCall(
				(cid: ChannelCommunityId, ids: ChannelClientId[]) => {
					capturedCommunityId = cid;
					capturedClientIds = ids;
					return Promise.resolve(true);
				},
			);

			const client = createFakeClient([{ id: "100", memberIds: ["200"], channelIds: ["300", "301"] }]);
			await DataDeletionCircularHandler(client as any);

			expect((capturedCommunityId as ChannelCommunityId | null)?.getValue()).to.equal(communityId.getValue());
			expect(capturedClientIds.map((c) => c.getValue())).to.deep.equal([BigInt("300"), BigInt("301")]);
			verify((channelLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())).once();
		});

		/**
		 * [Repository条件] communityIdとNOT IN条件が適用される
		 * - deleteNotBelongByCommunityIdAndClientIdsのwhere条件を検証
		 */
		it("ChannelRepositoryImpl.deleteNotBelongByCommunityIdAndClientIdsはcommunityIdとNOT IN条件を持つ", async () => {
			let receivedWhere: any = null;
			const cleanup = mockRepositoryMethod(ChannelRepositoryImpl, "destroy", (options) => {
				receivedWhere = options.where;
			});

			const repo = new ChannelRepositoryImpl();
			await repo.deleteNotBelongByCommunityIdAndClientIds(new ChannelCommunityId(12), [
				new ChannelClientId(BigInt(99)),
				new ChannelClientId(BigInt(100)),
			]);

			expect(receivedWhere.communityId).to.equal(12);
			expect(receivedWhere.clientId[Op.notIn]).to.deep.equal([BigInt(99), BigInt(100)]);

			cleanup();
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
			const callOrder: string[] = [];
			(when((communityLogicMock as any).getNotExistClientId(anything(), anything())) as any).thenResolve([new CommunityClientId(BigInt("200"))]);
			(when((communityLogicMock as any).getId(anything())) as any).thenResolve(new CommunityId(30));
			when((userLogicMock as any).deletebyCommunityId(anything())).thenCall(() => {
				callOrder.push("deleteUsers");
				return Promise.resolve(true);
			});
			when((channelLogicMock as any).deletebyCommunityId(anything())).thenCall(() => {
				callOrder.push("deleteChannels");
				return Promise.resolve(true);
			});
			when((communityLogicMock as any).delete(anything())).thenCall(() => {
				callOrder.push("deleteCommunity");
				return Promise.resolve(true);
			});

			const client = createFakeClient([]);
			await DataDeletionCircularHandler(client as any);

			expect(callOrder).to.deep.equal(["deleteUsers", "deleteChannels", "deleteCommunity"]);
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
			let receivedWhere: any = null;
			const cleanup = mockRepositoryMethod(CommunityRepositoryImpl, "findAll", (options) => {
				receivedWhere = options.where;
			});

			const repo = new CommunityRepositoryImpl();
			await repo.getNotExistClientId(CommunityCategoryType.Discord, [new CommunityClientId(BigInt(1)), new CommunityClientId(BigInt(2))]);

			expect(receivedWhere.categoryType).to.equal(CommunityCategoryType.Discord.getValue());
			expect(receivedWhere.clientId[Op.notIn]).to.deep.equal([BigInt(1), BigInt(2)]);

			cleanup();
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
			let receivedWhere: any = null;
			const cleanup = mockRepositoryMethod(UserRepositoryImpl, "findAll", (options) => {
				receivedWhere = options.where;
			});

			const repo = new UserRepositoryImpl();
			await repo.findDeletionTargetsByBatchStatusAndDeletedAt();

			expect(receivedWhere.batchStatus).to.equal(UserBatchStatus.Yet.getValue());
			expect(receivedWhere.deletedAt[Op.not]).to.equal(null);

			cleanup();
		});

		/**
		 * [削除対象Community] batchStatus=Yet && deletedAt!=null のみ取得する
		 * - findDeletionTargetsByBatchStatusAndDeletedAtのwhere条件を検証
		 */
		it("CommunityRepositoryImpl.findDeletionTargetsByBatchStatusAndDeletedAtはbatchStatus=YetとdeletedAt!=nullのみ取得する", async () => {
			let receivedWhere: any = null;
			const cleanup = mockRepositoryMethod(CommunityRepositoryImpl, "findAll", (options) => {
				receivedWhere = options.where;
			});

			const repo = new CommunityRepositoryImpl();
			await repo.findDeletionTargetsByBatchStatusAndDeletedAt();

			expect(receivedWhere.batchStatus).to.equal(CommunityBatchStatus.Yet.getValue());
			expect(receivedWhere.deletedAt[Op.not]).to.equal(null);

			cleanup();
		});

		/**
		 * [削除対象Channel] batchStatus=Yet && deletedAt!=null のみ取得する
		 * - findDeletionTargetsByBatchStatusAndDeletedAtのwhere条件を検証
		 */
		it("ChannelRepositoryImpl.findDeletionTargetsByBatchStatusAndDeletedAtはbatchStatus=YetとdeletedAt!=nullのみ取得する", async () => {
			let receivedWhere: any = null;
			const cleanup = mockRepositoryMethod(ChannelRepositoryImpl, "findAll", (options) => {
				receivedWhere = options.where;
			});

			const repo = new ChannelRepositoryImpl();
			await repo.findDeletionTargetsByBatchStatusAndDeletedAt();

			expect(receivedWhere.batchStatus).to.equal(ChannelBatchStatus.Yet.getValue());
			expect(receivedWhere.deletedAt[Op.not]).to.equal(null);

			cleanup();
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
			let communityUpdateOptions: any = null;
			let userUpdateOptions: any = null;
			let channelUpdateOptions: any = null;

			const communityCleanup = mockRepositoryMethod(CommunityRepositoryImpl, "update", (options) => {
				communityUpdateOptions = options;
			});
			const userCleanup = mockRepositoryMethod(UserRepositoryImpl, "update", (options) => {
				userUpdateOptions = options;
			});
			const channelCleanup = mockRepositoryMethod(ChannelRepositoryImpl, "update", (options) => {
				channelUpdateOptions = options;
			});

			const communityRepo = new CommunityRepositoryImpl();
			const userRepo = new UserRepositoryImpl();
			const channelRepo = new ChannelRepositoryImpl();
			await communityRepo.updatebatchStatus(new CommunityId(1));
			await userRepo.updatebatchStatus(new UserId(2));
			await channelRepo.updatebatchStatus(new ChannelId(3));

			expect(communityUpdateOptions.paranoid).to.equal(false);
			expect(communityUpdateOptions.where.batchStatus).to.equal(CommunityBatchStatus.Yet.getValue());
			expect(userUpdateOptions.paranoid).to.equal(false);
			expect(userUpdateOptions.where.batchStatus).to.equal(UserBatchStatus.Yet.getValue());
			expect(channelUpdateOptions.paranoid).to.equal(false);
			expect(channelUpdateOptions.where.batchStatus).to.equal(ChannelBatchStatus.Yet.getValue());

			communityCleanup();
			userCleanup();
			channelCleanup();
		});
	});
});
