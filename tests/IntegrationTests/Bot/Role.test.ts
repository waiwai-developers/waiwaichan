import { RoleDto } from "@/src/entities/dto/RoleDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { RoleBatchStatus } from "@/src/entities/vo/RoleBatchStatus";
import { RoleCategoryType } from "@/src/entities/vo/RoleCategoryType";
import { RoleClientId } from "@/src/entities/vo/RoleClientId";
import { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import { BotAddHandler } from "@/src/handlers/discord.js/events/BotAddHandler";
import { BotRemoveHandler } from "@/src/handlers/discord.js/events/BotRemoveHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IRoleLogic } from "@/src/logics/Interfaces/logics/IRoleLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { RoleRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoleRepositoryImpl";
import { BotAddRouter } from "@/src/routes/discordjs/events/BotAddRouter";
import { BotRemoveRouter } from "@/src/routes/discordjs/events/BotRemoveRouter";
import { expect } from "chai";
import { Op } from "sequelize";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Role event integration tests", () => {
	// ========================================
	// Mock生成ヘルパー関数
	// ========================================

	const createLoggerMock = () => {
		const loggerMock = mock<ILogger>();
		when(loggerMock.info(anything())).thenCall(() => undefined);
		when(loggerMock.error(anything())).thenCall(() => undefined);
		return loggerMock;
	};

	const createCommunityLogicMock = (overrides?: {
		createResult?: CommunityId | undefined;
		getIdResult?: CommunityId | undefined;
		deleteResult?: boolean;
	}) => {
		const mock_ = mock<ICommunityLogic>();
		if (overrides?.createResult !== undefined) {
			when(mock_.create(anything() as any)).thenResolve(overrides.createResult as any);
		}
		if (overrides?.getIdResult !== undefined) {
			when(mock_.getId(anything() as any)).thenResolve(overrides.getIdResult as any);
		}
		if (overrides?.deleteResult !== undefined) {
			when(mock_.delete(anything() as any)).thenResolve(overrides.deleteResult);
		}
		return mock_;
	};

	const createUserLogicMock = (overrides?: {
		bulkCreateResult?: boolean;
		deletebyCommunityIdResult?: boolean;
	}) => {
		const mock_ = mock<IUserLogic>();
		if (overrides?.bulkCreateResult !== undefined) {
			when(mock_.bulkCreate(anything() as any)).thenResolve(overrides.bulkCreateResult);
		}
		if (overrides?.deletebyCommunityIdResult !== undefined) {
			when(mock_.deletebyCommunityId(anything() as any)).thenResolve(overrides.deletebyCommunityIdResult);
		}
		return mock_;
	};

	const createChannelLogicMock = (overrides?: {
		bulkCreateResult?: boolean;
		deletebyCommunityIdResult?: boolean;
	}) => {
		const mock_ = mock<IChannelLogic>();
		if (overrides?.bulkCreateResult !== undefined) {
			when(mock_.bulkCreate(anything() as any)).thenResolve(overrides.bulkCreateResult);
		}
		if (overrides?.deletebyCommunityIdResult !== undefined) {
			when(mock_.deletebyCommunityId(anything() as any)).thenResolve(overrides.deletebyCommunityIdResult);
		}
		return mock_;
	};

	const createRoleLogicMock = (overrides?: {
		bulkCreateResult?: boolean;
		deletebyCommunityIdResult?: boolean;
	}) => {
		const mock_ = mock<IRoleLogic>();
		if (overrides?.bulkCreateResult !== undefined) {
			when(mock_.bulkCreate(anything() as any)).thenResolve(overrides.bulkCreateResult);
		}
		if (overrides?.deletebyCommunityIdResult !== undefined) {
			when(mock_.deletebyCommunityId(anything() as any)).thenResolve(overrides.deletebyCommunityIdResult);
		}
		return mock_;
	};

	const createRoleCollection = (items: { id: string }[]) => ({
		filter: (predicate: (role: { id: string } | null) => boolean) => {
			const filtered = items.filter(predicate);
			return {
				map: (mapper: (role: { id: string }) => any) => filtered.map(mapper),
			};
		},
		map: (mapper: (role: { id: string }) => any) => items.map(mapper),
	});

	const createGuildMock = (
		guildId: string,
		members: { id: string; user: { bot: boolean } }[] = [],
		channels: { id: string; type: number }[] = [],
		roles: { id: string }[] = [],
	): any => ({
		id: guildId,
		members: {
			fetch: async () => ({
				map: (mapper: (member: { id: string; user: { bot: boolean } }) => any) => members.map(mapper),
			}),
		},
		channels: {
			fetch: async () => ({
				filter: (predicate: (channel: { id: string; type: number } | null) => boolean) => {
					const filtered = channels.filter(predicate);
					return {
						map: (mapper: (channel: { id: string; type: number }) => any) => filtered.map(mapper),
					};
				},
			}),
		},
		roles: {
			fetch: async () => createRoleCollection(roles),
		},
	});

	const createClientMockWithEventCapture = () => {
		const callbacks: { [event: string]: ((payload: any) => Promise<void>) | null } = {};
		const client = {
			on: (event: string, callback: (payload: any) => Promise<void>) => {
				callbacks[event] = callback;
			},
		};
		return { client: client as any, callbacks };
	};

	// ========================================
	// Handler/Router初期化ヘルパー関数
	// ========================================

	const injectHandlerDependencies = <T>(
		handler: T,
		deps: {
			logger?: ILogger;
			communityLogic?: ICommunityLogic;
			userLogic?: IUserLogic;
			channelLogic?: IChannelLogic;
			roleLogic?: IRoleLogic;
		},
	): T => {
		if (deps.logger) (handler as any).logger = deps.logger;
		if (deps.communityLogic) (handler as any).CommunityLogic = deps.communityLogic;
		if (deps.userLogic) (handler as any).UserLogic = deps.userLogic;
		if (deps.channelLogic) (handler as any).ChannelLogic = deps.channelLogic;
		if (deps.roleLogic) (handler as any).RoleLogic = deps.roleLogic;
		return handler;
	};

	const injectRouterDependencies = <T, H>(
		router: T,
		deps: {
			logger?: ILogger;
			handler?: H;
		},
	): T => {
		if (deps.logger) (router as any).logger = deps.logger;
		if (deps.handler) (router as any).handler = deps.handler;
		return router;
	};

	const testEventRegistration = async <TRouter, TPayload>(router: TRouter, eventName: string, payload: TPayload): Promise<void> => {
		const { client, callbacks } = createClientMockWithEventCapture();
		(router as any).register(client);
		if (!callbacks[eventName]) {
			throw new Error(`${eventName} handler was not registered`);
		}
		await callbacks[eventName](payload);
	};

	const setupRouterAndVerifyHandlerCall = async <TRouter, THandler, TPayload>(
		RouterClass: new () => TRouter,
		handlerMock: THandler,
		eventName: string,
		payload: TPayload,
	): Promise<void> => {
		const router = new RouterClass();
		injectRouterDependencies(router, {
			logger: instance(createLoggerMock()),
			handler: instance(handlerMock),
		});
		await testEventRegistration(router, eventName, payload);
	};

	const setupHandlerWithMocks = <T>(
		HandlerClass: new () => T,
	): {
		handler: T;
		loggerMock: ILogger;
		communityLogicMock: ICommunityLogic;
		userLogicMock: IUserLogic;
		channelLogicMock: IChannelLogic;
		roleLogicMock: IRoleLogic;
	} => {
		const loggerMock = createLoggerMock();
		const communityLogicMock = mock<ICommunityLogic>();
		const userLogicMock = mock<IUserLogic>();
		const channelLogicMock = mock<IChannelLogic>();
		const roleLogicMock = mock<IRoleLogic>();
		const handler = new HandlerClass();
		injectHandlerDependencies(handler, {
			logger: instance(loggerMock),
			communityLogic: instance(communityLogicMock),
			userLogic: instance(userLogicMock),
			channelLogic: instance(channelLogicMock),
			roleLogic: instance(roleLogicMock),
		});
		return { handler, loggerMock, communityLogicMock, userLogicMock, channelLogicMock, roleLogicMock };
	};

	/**
	 * 1) BotAddRouter / BotAddHandler (Role追加)
	 */
	describe("1) BotAddRouter / BotAddHandler", () => {
		it("guildCreateでRouterがHandlerを呼び出す", async () => {
			const handlerMock = mock<BotAddHandler>();
			const guild = createGuildMock("100", [], [], []);
			await setupRouterAndVerifyHandlerCall(BotAddRouter, handlerMock, "guildCreate", guild);
			verify(handlerMock.handle(guild)).once();
		});

		it("CommunityLogic.createが呼ばれ、未作成の場合は処理停止する", async () => {
			const { handler, communityLogicMock, roleLogicMock } = setupHandlerWithMocks(BotAddHandler);

			(when(communityLogicMock.create(anything()) as any) as any).thenResolve(undefined);

			const guild = createGuildMock("200", [], [], [{ id: "1001" }]);
			await handler.handle(guild);

			verify(communityLogicMock.create(anything())).once();
			verify(roleLogicMock.bulkCreate(anything())).never();
		});

		it("RoleLogic.bulkCreateが実行される", async () => {
			const { handler, communityLogicMock, userLogicMock, channelLogicMock, roleLogicMock } = setupHandlerWithMocks(BotAddHandler);
			const communityId = new CommunityId(99);

			(when(communityLogicMock.create(anything()) as any) as any).thenResolve(communityId);
			when(userLogicMock.bulkCreate(anything() as any)).thenResolve(true);
			when(channelLogicMock.bulkCreate(anything() as any)).thenResolve(true);
			let receivedRoles: RoleDto[] = [];
			when(roleLogicMock.bulkCreate(anything() as any)).thenCall((roles: RoleDto[]) => {
				receivedRoles = roles;
				return Promise.resolve(true);
			});

			const guild = createGuildMock("300", [], [], [{ id: "1001" }, { id: "1002" }, { id: "1003" }]);

			await handler.handle(guild);

			expect(receivedRoles).to.have.length(3);
			verify(roleLogicMock.bulkCreate(anything())).once();
		});

		it("RoleDtoのcategoryType/clientId/communityIdが正しい", async () => {
			const { handler, communityLogicMock, userLogicMock, channelLogicMock, roleLogicMock } = setupHandlerWithMocks(BotAddHandler);
			const communityId = new CommunityId(77);

			(when(communityLogicMock.create(anything()) as any) as any).thenResolve(communityId);
			when(userLogicMock.bulkCreate(anything() as any)).thenResolve(true);
			when(channelLogicMock.bulkCreate(anything() as any)).thenResolve(true);
			let receivedRoles: RoleDto[] = [];
			when(roleLogicMock.bulkCreate(anything() as any)).thenCall((roles: RoleDto[]) => {
				receivedRoles = roles;
				return Promise.resolve(true);
			});

			const guild = createGuildMock("400", [], [], [{ id: "123456789" }]);

			await handler.handle(guild);

			const role = receivedRoles[0];
			expect(role.categoryType.getValue()).to.equal(RoleCategoryType.Discord.getValue());
			expect(role.clientId.getValue()).to.equal(BigInt("123456789"));
			expect(role.communityId.getValue()).to.equal(communityId.getValue());
		});

		it("ロールが0件の場合はRoleLogic.bulkCreateが呼ばれない", async () => {
			const { handler, communityLogicMock, userLogicMock, channelLogicMock, roleLogicMock } = setupHandlerWithMocks(BotAddHandler);
			const communityId = new CommunityId(55);

			(when(communityLogicMock.create(anything()) as any) as any).thenResolve(communityId);
			when(userLogicMock.bulkCreate(anything() as any)).thenResolve(true);
			when(channelLogicMock.bulkCreate(anything() as any)).thenResolve(true);

			const guild = createGuildMock("500", [], [], []);

			await handler.handle(guild);

			verify(roleLogicMock.bulkCreate(anything())).never();
		});
	});

	/**
	 * 2) BotRemoveRouter / BotRemoveHandler (Role削除)
	 */
	describe("2) BotRemoveRouter / BotRemoveHandler", () => {
		it("guildDeleteでRouterがHandlerを呼び出す", async () => {
			const handlerMock = mock<BotRemoveHandler>();
			const guild = createGuildMock("600", [], [], []);
			await setupRouterAndVerifyHandlerCall(BotRemoveRouter, handlerMock, "guildDelete", guild);
			verify(handlerMock.handle(guild)).once();
		});

		it("CommunityLogic.getIdが取得できない場合は削除しない", async () => {
			const { handler, communityLogicMock, roleLogicMock } = setupHandlerWithMocks(BotRemoveHandler);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

			const guild = createGuildMock("700", [], [], []);
			await handler.handle(guild);

			verify(roleLogicMock.deletebyCommunityId(anything())).never();
		});

		it("CommunityLogic.deleteに失敗した場合は後続処理がスキップされる", async () => {
			const { handler, communityLogicMock, roleLogicMock } = setupHandlerWithMocks(BotRemoveHandler);
			const communityId = new CommunityId(88);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			(when(communityLogicMock.delete(anything()) as any) as any).thenResolve(false);

			const guild = createGuildMock("800", [], [], []);
			await handler.handle(guild);

			verify(roleLogicMock.deletebyCommunityId(anything())).never();
		});

		it("RoleLogic.deletebyCommunityIdが呼ばれる", async () => {
			const { handler, communityLogicMock, userLogicMock, channelLogicMock, roleLogicMock } = setupHandlerWithMocks(BotRemoveHandler);
			const communityId = new CommunityId(101);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			(when(communityLogicMock.delete(anything()) as any) as any).thenResolve(true);
			when(userLogicMock.deletebyCommunityId(anything() as any)).thenResolve(true);
			when(channelLogicMock.deletebyCommunityId(anything() as any)).thenResolve(true);
			when(roleLogicMock.deletebyCommunityId(anything() as any)).thenResolve(true);

			const guild = createGuildMock("900", [], [], []);
			await handler.handle(guild);

			verify(roleLogicMock.deletebyCommunityId(anything())).once();
		});

		it("communityId条件で削除される", async () => {
			const originalDestroy = RoleRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(RoleRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await RoleRepositoryImpl.prototype.deletebyCommunityId.call({} as RoleRepositoryImpl, new RoleCommunityId(5));

			expect(receivedWhere).to.deep.equal({
				communityId: 5,
			});
			(RoleRepositoryImpl as any).destroy = originalDestroy;
		});
	});

	/**
	 * 3) RoleRepository関連のテスト
	 */
	describe("3) RoleRepository", () => {
		it("RoleRepositoryImpl.bulkCreateがbatchStatus=Yetで作成される", async () => {
			const originalBulkCreate = RoleRepositoryImpl.bulkCreate;
			let receivedRows: any[] = [];
			(RoleRepositoryImpl as any).bulkCreate = (rows: any[]) => {
				receivedRows = rows;
				return Promise.resolve(rows);
			};

			await RoleRepositoryImpl.prototype.bulkCreate.call({} as RoleRepositoryImpl, [
				new RoleDto(RoleCategoryType.Discord, new RoleClientId(BigInt(10)), new RoleCommunityId(20)),
			]);

			expect(receivedRows[0].batchStatus).to.equal(RoleBatchStatus.Yet.getValue());
			(RoleRepositoryImpl as any).bulkCreate = originalBulkCreate;
		});

		it("RoleRepositoryImpl.deleteByCommunityIdAndClientIdはcommunityIdとclientId条件が適用される", async () => {
			const originalDestroy = RoleRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(RoleRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await RoleRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as RoleRepositoryImpl,
				new RoleCommunityId(11),
				new RoleClientId(BigInt(22)),
			);

			expect(receivedWhere).to.deep.equal({
				clientId: BigInt(22),
				communityId: 11,
			});

			(RoleRepositoryImpl as any).destroy = originalDestroy;
		});

		it("RoleRepositoryImpl.deletebyCommunityIdのcommunityId条件が適用される", async () => {
			const originalDestroy = RoleRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(RoleRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await RoleRepositoryImpl.prototype.deletebyCommunityId.call({} as RoleRepositoryImpl, new RoleCommunityId(33));

			expect(receivedWhere.communityId).to.equal(33);
			(RoleRepositoryImpl as any).destroy = originalDestroy;
		});

		it("RoleRepositoryImpl.deleteNotBelongByCommunityIdAndClientIdsはNOT IN条件が適用される", async () => {
			const originalDestroy = RoleRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(RoleRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await RoleRepositoryImpl.prototype.deleteNotBelongByCommunityIdAndClientIds.call({} as RoleRepositoryImpl, new RoleCommunityId(9), [
				new RoleClientId(BigInt(10)),
				new RoleClientId(BigInt(11)),
			]);

			expect(receivedWhere.communityId).to.equal(9);
			expect(receivedWhere.clientId[Op.notIn]).to.deep.equal([BigInt(10), BigInt(11)]);

			(RoleRepositoryImpl as any).destroy = originalDestroy;
		});
	});

	/**
	 * 4) エラー処理テスト
	 */
	describe("4) Error handling", () => {
		it("Router/Handlerで例外が発生した場合にログに出力される", async () => {
			const router = new BotAddRouter();
			const routerLogger = createLoggerMock();
			const handlerMock = mock<BotAddHandler>();
			when(handlerMock.handle(anything())).thenThrow(new Error("boom"));

			(router as any).logger = instance(routerLogger);
			(router as any).handler = instance(handlerMock);

			const guild = createGuildMock("100", [], [], []);
			let registeredCallback: ((g: any) => Promise<void>) | null = null;
			const client = {
				on: (event: string, callback: (g: any) => Promise<void>) => {
					if (event === "guildCreate") {
						registeredCallback = callback;
					}
				},
			} as any;

			router.register(client);
			if (!registeredCallback) {
				throw new Error("guildCreate handler was not registered");
			}
			await (registeredCallback as (payload: any) => Promise<void>)(guild);

			verify(routerLogger.error("Error: Error: boom")).once();

			const handler = new BotAddHandler();
			const handlerLogger = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const roleLogicMock = mock<IRoleLogic>();
			when(communityLogicMock.create(anything() as any)).thenThrow(new Error("handler error"));

			(handler as any).logger = instance(handlerLogger);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).RoleLogic = instance(roleLogicMock);

			const guild2 = createGuildMock("999", [], [], []);
			await handler.handle(guild2);

			verify(handlerLogger.error("BotAddHandler error: Error: handler error")).once();
		});
	});
});
