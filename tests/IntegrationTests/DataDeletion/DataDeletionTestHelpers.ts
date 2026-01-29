import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import type { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import type { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { MessageChannelId } from "@/src/entities/vo/MessageChannelId";
import type { MessageClientId } from "@/src/entities/vo/MessageClientId";
import type { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import type { MessageUserId } from "@/src/entities/vo/MessageUserId";
import type { UserClientId } from "@/src/entities/vo/UserClientId";
import type { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { DataDeletionCircularHandler } from "@/src/handlers/discord.js/events/DataDeletionCircularHandler";
import type { DataDeletionCircularLogic } from "@/src/logics/DataDeletionCircularLogic";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { MysqlSchedulerConnector } from "@/src/repositories/sequelize-mysql/MysqlSchedulerConnector";
import { schedulerContainer } from "@/src/scheduler.di.config";
import { expect } from "chai";
import { Op } from "sequelize";
import { anything, instance, mock, verify, when } from "ts-mockito";

// ===================================
// Type Definitions
// ===================================

export interface MockMember {
	user: { id: string };
}

export interface MockChannel {
	id: string;
}

export interface MockGuild {
	id: string;
	members: {
		fetch: () => Promise<Map<string, MockMember>>;
	};
	channels: {
		fetch: () => Promise<Map<string, MockChannel>>;
	};
}

export interface MockClient {
	guilds: {
		cache: {
			values: () => IterableIterator<{ id: string }>;
			map: <T>(mapper: (g: { id: string }) => T) => T[];
		};
		fetch: (id: string) => Promise<MockGuild | undefined>;
	};
}

export interface GuildConfig {
	id: string;
	memberIds: string[];
	channelIds: string[];
}

export interface RepositoryWhereConditions {
	communityId?: number;
	categoryType?: string | number;
	batchStatus?: number | string;
	clientId?: Record<symbol, bigint[]>;
	deletedAt?: Record<symbol, null>;
}

export interface RepositoryUpdateOptions {
	where?: RepositoryWhereConditions;
	paranoid?: boolean;
}

export interface MockModel {
	getAttributes: () => Record<string, unknown>;
	destroy: (options?: unknown) => Promise<number>;
}

export interface DeleteArgumentCapture<TCommunityId, TClientId> {
	getCommunityId: () => TCommunityId | null;
	getClientIds: () => TClientId[];
}

// ===================================
// Helper Functions: Mock Creation
// ===================================

export const createMembers = (ids: string[]): Map<string, MockMember> => {
	const members = new Map<string, MockMember>();
	ids.forEach((id) => members.set(id, { user: { id } }));
	return members;
};

export const createChannels = (ids: string[]): Map<string, MockChannel> => {
	const channels = new Map<string, MockChannel>();
	ids.forEach((id) => channels.set(id, { id }));
	return channels;
};

export const createFakeClient = (guilds: GuildConfig[]): MockClient => {
	const guildStore = new Map<string, MockGuild>(
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
		map: <T>(mapper: (g: { id: string }) => T) => guildEntries.map(mapper),
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
 * @param RepositoryClass モック対象のRepositoryクラス
 * @param methodName モック対象のメソッド名
 * @param captureCallback where条件をキャプチャするコールバック
 * @returns クリーンアップ関数
 */
export const mockRepositoryMethod = <T extends Record<string, any>>(
	RepositoryClass: T,
	methodName: keyof T,
	captureCallback: (options: any) => void,
): (() => void) => {
	const originalMethod = RepositoryClass[methodName];
	(RepositoryClass as any)[methodName] = (optionsOrValues: any, options?: any) => {
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
		(RepositoryClass as any)[methodName] = originalMethod;
	};
};

/**
 * MysqlConnector/MysqlSchedulerConnectorのmodelsをモック化するヘルパー
 * @param connectorModels MysqlConnector用のモデル配列
 * @param schedulerModels MysqlSchedulerConnector用のモデル配列
 * @returns クリーンアップ関数
 */
export const mockConnectorModels = (connectorModels: MockModel[], schedulerModels: MockModel[] = []): (() => void) => {
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
export const mockConsoleError = (captureCallback: (message: string) => void): (() => void) => {
	const originalConsoleError = console.error;
	console.error = (message?: unknown) => {
		captureCallback(String(message));
	};
	return () => {
		console.error = originalConsoleError;
	};
};

// ===================================
// Helper Functions: Handler Initialization
// ===================================

/**
 * Handler用のモックとDIコンテナをセットアップするヘルパー
 * @returns モックオブジェクトとクリーンアップ関数
 */
export const setupHandlerMocks = () => {
	const communityLogicMock = mock<ICommunityLogic>();
	const userLogicMock = mock<IUserLogic>();
	const channelLogicMock = mock<IChannelLogic>();
	const messageLogicMock = mock<IMessageLogic>();
	const dataDeletionLogicMock = mock<DataDeletionCircularLogic>();

	const originalGet = schedulerContainer.get.bind(schedulerContainer);

	// DIコンテナのgetメソッドをモックに差し替え
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
		if (token === LogicTypes.MessageLogic) {
			return instance(messageLogicMock);
		}
		if (token === LogicTypes.dataDeletionCircularLogic) {
			return instance(dataDeletionLogicMock);
		}
		return originalGet(token);
	};

	// デフォルトの振る舞いを設定
	when((communityLogicMock as any).getNotExistClientId(anything(), anything()) as any).thenReturn(Promise.resolve([] as any[]));
	when((userLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()).thenResolve([] as any);
	when((communityLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()).thenResolve([] as any);
	when((channelLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()).thenResolve([] as any);
	when((messageLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()).thenResolve([] as any);
	when((messageLogicMock as any).deleteByChannelIdAndReturnClientIds(anything())).thenResolve([] as any);
	when((messageLogicMock as any).deleteByUserIdAndReturnClientIds(anything())).thenResolve([] as any);
	(when((messageLogicMock as any).deletebyCommunityId(anything())) as any).thenReturn(Promise.resolve(true));

	// クリーンアップ関数
	const cleanup = () => {
		(schedulerContainer as any).get = originalGet;
	};

	return {
		communityLogicMock,
		userLogicMock,
		channelLogicMock,
		messageLogicMock,
		dataDeletionLogicMock,
		cleanup,
	};
};

// ===================================
// Helper Functions: Repository Test
// ===================================

/**
 * Repository条件テストのヘルパー（NOT IN条件）
 * @param RepositoryClass テスト対象のRepositoryクラス
 * @param methodName テスト対象のメソッド名
 * @param executeMethod 実行するメソッド（引数を受け取る関数）
 * @param expectedConditions 期待される条件（communityId, clientIds等）
 */
export const testRepositoryNotInCondition = async <T>(
	RepositoryClass: new () => T,
	methodName: string,
	executeMethod: (repo: T) => Promise<any>,
	expectedConditions: {
		communityId?: number;
		categoryType?: string | number;
		clientIds?: bigint[];
	},
) => {
	let receivedWhere: any = null;
	const cleanup = mockRepositoryMethod(RepositoryClass as any, methodName, (options) => {
		receivedWhere = options?.where;
	});

	// Repositoryクラスのプロトタイプを使って、インスタンスメソッドを静的コンテキストで実行
	const proto = RepositoryClass.prototype;
	await executeMethod(proto as T);

	if (expectedConditions.communityId !== undefined) {
		expect(receivedWhere?.communityId).to.equal(expectedConditions.communityId);
	}
	if (expectedConditions.categoryType !== undefined) {
		expect(receivedWhere?.categoryType).to.equal(expectedConditions.categoryType);
	}
	if (expectedConditions.clientIds !== undefined) {
		expect(receivedWhere?.clientId[Op.notIn]).to.deep.equal(expectedConditions.clientIds);
	}

	cleanup();
};

/**
 * Repository削除対象検索テストのヘルパー
 * @param RepositoryClass テスト対象のRepositoryクラス
 * @param expectedBatchStatus 期待されるbatchStatus値
 */
export const testRepositoryFindDeletionTargets = async <T>(RepositoryClass: new () => T, expectedBatchStatus: number | string) => {
	let receivedWhere: any = null;
	const cleanup = mockRepositoryMethod(RepositoryClass as any, "findAll", (options) => {
		receivedWhere = options?.where;
	});

	// Repositoryクラスのプロトタイプを使って、インスタンスメソッドを静的コンテキストで実行
	const proto = RepositoryClass.prototype;
	await (proto as any).findDeletionTargetsByBatchStatusAndDeletedAt();

	expect(receivedWhere?.batchStatus).to.equal(expectedBatchStatus);
	expect(receivedWhere?.deletedAt[Op.not]).to.equal(null);

	cleanup();
};

/**
 * Repositoryバッチ更新テストのヘルパー
 * @param RepositoryClass テスト対象のRepositoryクラス
 * @param idInstance 更新対象のIDインスタンス
 * @param expectedBatchStatus 期待されるbatchStatus値
 */
export const testRepositoryUpdateBatchStatus = async <T, TId>(
	RepositoryClass: new () => T,
	idInstance: TId,
	expectedBatchStatus: number | string,
) => {
	let updateOptions: any = null;

	const cleanup = mockRepositoryMethod(RepositoryClass as any, "update", (options) => {
		updateOptions = options;
	});

	// Repositoryクラスのプロトタイプを使って、インスタンスメソッドを静的コンテキストで実行
	const proto = RepositoryClass.prototype;
	await (proto as any).updatebatchStatus(idInstance);

	expect(updateOptions?.paranoid).to.equal(false);
	expect(updateOptions?.where?.batchStatus).to.equal(expectedBatchStatus);

	cleanup();
};

// ===================================
// Helper Functions: Event Registration Test
// ===================================

/**
 * User削除メソッドの引数をキャプチャするヘルパー
 * @param userLogicMock モック化されたUserLogic
 * @returns キャプチャされた引数を返すオブジェクト
 */
export const setupUserDeleteArgumentCapture = (userLogicMock: IUserLogic) => {
	let capturedCommunityId: UserCommunityId | null = null;
	let capturedClientIds: UserClientId[] = [];

	(when((userLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenCall(
		(cid: UserCommunityId, ids: UserClientId[]) => {
			capturedCommunityId = cid;
			capturedClientIds = ids;
			return Promise.resolve(true);
		},
	);

	return {
		getCommunityId: () => capturedCommunityId,
		getClientIds: () => capturedClientIds,
	};
};

/**
 * Channel削除メソッドの引数をキャプチャするヘルパー
 * @param channelLogicMock モック化されたChannelLogic
 * @returns キャプチャされた引数を返すオブジェクト
 */
export const setupChannelDeleteArgumentCapture = (channelLogicMock: IChannelLogic) => {
	let capturedCommunityId: ChannelCommunityId | null = null;
	let capturedClientIds: ChannelClientId[] = [];

	(when((channelLogicMock as any).deleteNotBelongByCommunityIdAndClientIds(anything(), anything())) as any).thenCall(
		(cid: ChannelCommunityId, ids: ChannelClientId[]) => {
			capturedCommunityId = cid;
			capturedClientIds = ids;
			return Promise.resolve(true);
		},
	);

	return {
		getCommunityId: () => capturedCommunityId,
		getClientIds: () => capturedClientIds,
	};
};

/**
 * 削除処理の実行順序を追跡するヘルパー
 * @param userLogicMock モック化されたUserLogic
 * @param channelLogicMock モック化されたChannelLogic
 * @param communityLogicMock モック化されたCommunityLogic
 * @returns 実行順序を記録した配列を返すオブジェクト
 */
export const setupDeletionOrderTracking = (userLogicMock: IUserLogic, channelLogicMock: IChannelLogic, communityLogicMock: ICommunityLogic) => {
	const callOrder: string[] = [];

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

	return {
		getCallOrder: () => callOrder,
	};
};

/**
 * ハンドラーを実行し、削除メソッドの引数を検証するヘルパー
 * @param communityLogicMock モック化されたCommunityLogic
 * @param expectedCommunityId 期待されるCommunityId
 * @param client Discordクライアント
 * @param capture 引数キャプチャオブジェクト
 * @param expectedClientIds 期待されるClientId配列（文字列形式）
 */
export const executeAndVerifyDeletionArguments = async <T extends UserClientId | ChannelClientId>(
	communityLogicMock: ICommunityLogic,
	expectedCommunityId: CommunityId,
	client: any,
	capture: {
		getCommunityId: () => UserCommunityId | ChannelCommunityId | null;
		getClientIds: () => T[];
	},
	expectedClientIds: string[],
) => {
	(when((communityLogicMock as any).getId(anything())) as any).thenResolve(expectedCommunityId);
	await DataDeletionCircularHandler(client);

	const capturedCommunityId = capture.getCommunityId();
	const capturedClientIds = capture.getClientIds();

	expect(capturedCommunityId?.getValue()).to.equal(expectedCommunityId.getValue());
	expect(capturedClientIds.map((c) => c.getValue())).to.deep.equal(expectedClientIds.map((id) => BigInt(id)));
};

// ===================================
// Helper Functions: Message Deletion Test
// ===================================

/**
 * Message削除（User関連）の引数をキャプチャするヘルパー
 * @param messageLogicMock モック化されたMessageLogic
 * @returns キャプチャされた引数を返すオブジェクト
 */
export const setupMessageDeleteByUserIdArgumentCapture = (messageLogicMock: IMessageLogic) => {
	const capturedUserIds: MessageUserId[] = [];
	const returnedClientIds: MessageClientId[] = [];

	(when((messageLogicMock as any).deleteByUserIdAndReturnClientIds(anything())) as any).thenCall((userId: MessageUserId) => {
		capturedUserIds.push(userId);
		return Promise.resolve(returnedClientIds);
	});

	return {
		getUserIds: () => capturedUserIds,
		setReturnedClientIds: (clientIds: MessageClientId[]) => {
			returnedClientIds.length = 0;
			returnedClientIds.push(...clientIds);
		},
	};
};

/**
 * Message削除（Channel関連）の引数をキャプチャするヘルパー
 * @param messageLogicMock モック化されたMessageLogic
 * @returns キャプチャされた引数を返すオブジェクト
 */
export const setupMessageDeleteByChannelIdArgumentCapture = (messageLogicMock: IMessageLogic) => {
	const capturedChannelIds: MessageChannelId[] = [];
	const returnedClientIds: MessageClientId[] = [];

	(when((messageLogicMock as any).deleteByChannelIdAndReturnClientIds(anything())) as any).thenCall((channelId: MessageChannelId) => {
		capturedChannelIds.push(channelId);
		return Promise.resolve(returnedClientIds);
	});

	return {
		getChannelIds: () => capturedChannelIds,
		setReturnedClientIds: (clientIds: MessageClientId[]) => {
			returnedClientIds.length = 0;
			returnedClientIds.push(...clientIds);
		},
	};
};

/**
 * Message削除（Community関連）の引数をキャプチャするヘルパー
 * @param messageLogicMock モック化されたMessageLogic
 * @returns キャプチャされた引数を返すオブジェクト
 */
export const setupMessageDeleteByCommunityIdArgumentCapture = (messageLogicMock: IMessageLogic) => {
	const capturedCommunityIds: MessageCommunityId[] = [];

	(when((messageLogicMock as any).deletebyCommunityId(anything())) as any).thenCall((communityId: MessageCommunityId) => {
		capturedCommunityIds.push(communityId);
		return Promise.resolve(true);
	});

	return {
		getCommunityIds: () => capturedCommunityIds,
	};
};

/**
 * Message削除を含む削除処理の実行順序を追跡するヘルパー
 * @param userLogicMock モック化されたUserLogic
 * @param channelLogicMock モック化されたChannelLogic
 * @param messageLogicMock モック化されたMessageLogic
 * @param communityLogicMock モック化されたCommunityLogic
 * @returns 実行順序を記録した配列を返すオブジェクト
 */
export const setupDeletionOrderTrackingWithMessages = (
	userLogicMock: IUserLogic,
	channelLogicMock: IChannelLogic,
	messageLogicMock: IMessageLogic,
	communityLogicMock: ICommunityLogic,
) => {
	const callOrder: string[] = [];

	when((userLogicMock as any).deletebyCommunityId(anything())).thenCall(() => {
		callOrder.push("deleteUsers");
		return Promise.resolve(true);
	});

	when((userLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()).thenCall(() => {
		callOrder.push("findDeletedUsers");
		return Promise.resolve([]);
	});

	when((channelLogicMock as any).deletebyCommunityId(anything())).thenCall(() => {
		callOrder.push("deleteChannels");
		return Promise.resolve(true);
	});

	when((channelLogicMock as any).findDeletionTargetsByBatchStatusAndDeletedAt()).thenCall(() => {
		callOrder.push("findDeletedChannels");
		return Promise.resolve([]);
	});

	when((messageLogicMock as any).deleteByUserIdAndReturnClientIds(anything())).thenCall(() => {
		callOrder.push("deleteMessagesForUser");
		return Promise.resolve([]);
	});

	when((messageLogicMock as any).deleteByChannelIdAndReturnClientIds(anything())).thenCall(() => {
		callOrder.push("deleteMessagesForChannel");
		return Promise.resolve([]);
	});

	when((messageLogicMock as any).deletebyCommunityId(anything())).thenCall(() => {
		callOrder.push("deleteMessagesForCommunity");
		return Promise.resolve(true);
	});

	when((communityLogicMock as any).delete(anything())).thenCall(() => {
		callOrder.push("deleteCommunity");
		return Promise.resolve(true);
	});

	return {
		getCallOrder: () => callOrder,
	};
};

/**
 * Repository削除条件テストのヘルパー（単一カラム条件）
 * @param RepositoryClass テスト対象のRepositoryクラス
 * @param methodName テスト対象のメソッド名
 * @param executeMethod 実行するメソッド（引数を受け取る関数）
 * @param expectedConditions 期待される条件
 */
export const testRepositorySingleColumnCondition = async <T>(
	RepositoryClass: new () => T,
	methodName: string,
	executeMethod: (repo: T) => Promise<any>,
	expectedConditions: {
		columnName: string;
		columnValue: number | bigint;
	},
) => {
	let receivedWhere: any = null;
	const cleanup = mockRepositoryMethod(RepositoryClass as any, methodName, (options) => {
		receivedWhere = options?.where;
	});

	// destroyメソッドもモックする（findAll→destroyの順で呼ぶメソッド用）
	// ただし、methodNameがdestroyの場合はスキップ
	let cleanupDestroy: (() => void) | null = null;
	if (methodName !== "destroy") {
		cleanupDestroy = mockRepositoryMethod(RepositoryClass as any, "destroy", () => {});
	}

	// Repositoryクラスのプロトタイプを使って、インスタンスメソッドを静的コンテキストで実行
	const proto = RepositoryClass.prototype;
	await executeMethod(proto as T);

	expect(receivedWhere?.[expectedConditions.columnName]).to.equal(expectedConditions.columnValue);

	cleanup();
	if (cleanupDestroy) {
		cleanupDestroy();
	}
};
