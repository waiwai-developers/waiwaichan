import { AppConfig } from "@/src/entities/config/AppConfig";
import { UserDto } from "@/src/entities/dto/UserDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { UserBatchStatus } from "@/src/entities/vo/UserBatchStatus";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import type { BotAddHandler } from "@/src/handlers/discord.js/events/BotAddHandler";
import { UserAddHandler } from "@/src/handlers/discord.js/events/UserAddHandler";
import { UserRemoveHandler } from "@/src/handlers/discord.js/events/UserRemoveHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
import { BotAddRouter } from "@/src/routes/discordjs/events/BotAddRouter";
import { UserAddRouter } from "@/src/routes/discordjs/events/UserAddRouter";
import { UserRemoveRouter } from "@/src/routes/discordjs/events/UserRemoveRouter";
import { expect } from "chai";
import { Op } from "sequelize";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("User event integration tests", () => {
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
		getIdResult?: CommunityId | undefined;
	}) => {
		const mock_ = mock<ICommunityLogic>();
		if (overrides?.getIdResult !== undefined) {
			when(mock_.getId(anything() as any)).thenResolve(overrides.getIdResult as any);
		}
		return mock_;
	};

	const createUserLogicMock = (overrides?: {
		bulkCreateResult?: boolean;
		deleteByCommunityIdAndClientIdResult?: boolean;
	}) => {
		const mock_ = mock<IUserLogic>();
		if (overrides?.bulkCreateResult !== undefined) {
			when(mock_.bulkCreate(anything() as any)).thenResolve(overrides.bulkCreateResult);
		}
		if (overrides?.deleteByCommunityIdAndClientIdResult !== undefined) {
			when(mock_.deleteByCommunityIdAndClientId(anything() as any, anything() as any)).thenResolve(overrides.deleteByCommunityIdAndClientIdResult);
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

	const createMemberMock = (memberId: string, guildId: string): any => ({
		id: memberId,
		guild: { id: guildId },
	});

	const createMemberCollection = (items: { id: string; user: { bot: boolean } }[]) => ({
		map: (mapper: (member: { id: string; user: { bot: boolean } }) => any) => items.map(mapper),
	});

	const createChannelCollection = (items: { id: string; type: number }[] = []) => ({
		filter: (predicate: (channel: { id: string; type: number } | null) => boolean) => {
			const filtered = items.filter(predicate);
			return {
				map: (mapper: (channel: { id: string; type: number }) => any) => filtered.map(mapper),
			};
		},
	});

	const createGuildMock = (
		guildId: string,
		members: { id: string; user: { bot: boolean } }[] = [],
		channels: { id: string; type: number }[] = [],
	): any => ({
		id: guildId,
		members: {
			fetch: async () => createMemberCollection(members),
		},
		channels: {
			fetch: async () => createChannelCollection(channels),
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
		},
	): T => {
		if (deps.logger) (handler as any).logger = deps.logger;
		if (deps.communityLogic) (handler as any).CommunityLogic = deps.communityLogic;
		if (deps.userLogic) (handler as any).UserLogic = deps.userLogic;
		if (deps.channelLogic) (handler as any).ChannelLogic = deps.channelLogic;
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
	} => {
		const loggerMock = createLoggerMock();
		const communityLogicMock = mock<ICommunityLogic>();
		const userLogicMock = mock<IUserLogic>();
		const channelLogicMock = mock<IChannelLogic>();
		const handler = new HandlerClass();
		injectHandlerDependencies(handler, {
			logger: instance(loggerMock),
			communityLogic: instance(communityLogicMock),
			userLogic: instance(userLogicMock),
			channelLogic: instance(channelLogicMock),
		});
		return { handler, loggerMock, communityLogicMock, userLogicMock, channelLogicMock };
	};

	/**
	 * 1) UserAddRouter / UserAddHandler (User追加)
	 */
	describe("1) UserAddRouter / UserAddHandler", () => {
		it("guildMemberAddでRouterがHandlerを呼び出す", async () => {
			const handlerMock = mock<UserAddHandler>();
			const member = createMemberMock("501", "500");
			await setupRouterAndVerifyHandlerCall(UserAddRouter, handlerMock, "guildMemberAdd", member);
			verify(handlerMock.handle(member)).once();
		});

		it("Bot自身の加入イベントは処理がスキップされる", async () => {
			const { handler, communityLogicMock, userLogicMock } = setupHandlerWithMocks(UserAddHandler);

			const member = {
				id: AppConfig.discord.clientId,
				guild: { id: "777" },
			} as any;

			await handler.handle(member);

			verify(communityLogicMock.getId(anything())).never();
			verify(userLogicMock.bulkCreate(anything())).never();
		});

		it("CommunityLogic.getIdが呼ばれ、未登録Communityでは処理停止する", async () => {
			const { handler, communityLogicMock, userLogicMock } = setupHandlerWithMocks(UserAddHandler);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

			const member = {
				id: "900",
				guild: { id: "901" },
			} as any;

			await handler.handle(member);

			verify(communityLogicMock.getId(anything())).once();
			verify(userLogicMock.bulkCreate(anything())).never();
		});

		it("UserLogic.bulkCreateが1件のみで実行される", async () => {
			const { handler, communityLogicMock, userLogicMock } = setupHandlerWithMocks(UserAddHandler);
			const communityId = new CommunityId(99);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			let receivedUsers: UserDto[] = [];
			when(userLogicMock.bulkCreate(anything() as any)).thenCall((users: UserDto[]) => {
				receivedUsers = users;
				return Promise.resolve(true);
			});

			const member = {
				id: "888",
				guild: { id: "777" },
			} as any;

			await handler.handle(member);

			expect(receivedUsers).to.have.length(1);
			verify(userLogicMock.bulkCreate(anything())).once();
		});

		it("UserDtoのcategoryType/clientId/communityIdが正しい", async () => {
			const { handler, communityLogicMock, userLogicMock } = setupHandlerWithMocks(UserAddHandler);
			const communityId = new CommunityId(77);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			let receivedUsers: UserDto[] = [];
			when(userLogicMock.bulkCreate(anything() as any)).thenCall((users: UserDto[]) => {
				receivedUsers = users;
				return Promise.resolve(true);
			});

			const member = {
				id: "2001",
				guild: { id: "2002" },
			} as any;

			await handler.handle(member);

			const user = receivedUsers[0];
			expect(user.categoryType.getValue()).to.equal(UserCategoryType.Discord.getValue());
			expect(user.clientId.getValue()).to.equal(BigInt("2001"));
			expect(user.communityId.getValue()).to.equal(communityId.getValue());
		});

		it("失敗時（bulkCreate=false）に後続処理は行われない", async () => {
			const { handler, communityLogicMock, userLogicMock } = setupHandlerWithMocks(UserAddHandler);
			const communityId = new CommunityId(55);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			when(userLogicMock.bulkCreate(anything() as any)).thenResolve(false);

			const member = {
				id: "3001",
				guild: { id: "3002" },
			} as any;

			await handler.handle(member);

			verify(userLogicMock.bulkCreate(anything())).once();
		});
	});

	/**
	 * 2) UserRemoveRouter / UserRemoveHandler (User削除)
	 */
	describe("2) UserRemoveRouter / UserRemoveHandler", () => {
		it("guildMemberRemoveでRouterがHandlerを呼び出す", async () => {
			const handlerMock = mock<UserRemoveHandler>();
			const member = createMemberMock("701", "700");
			await setupRouterAndVerifyHandlerCall(UserRemoveRouter, handlerMock, "guildMemberRemove", member);
			verify(handlerMock.handle(member)).once();
		});

		it("Bot自身の離脱イベントは処理がスキップされる", async () => {
			const { handler, communityLogicMock, userLogicMock } = setupHandlerWithMocks(UserRemoveHandler);

			const member = {
				id: AppConfig.discord.clientId,
				guild: { id: "111" },
			} as any;

			await handler.handle(member);

			verify(communityLogicMock.getId(anything())).never();
			verify(userLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).never();
		});

		it("CommunityLogic.getIdが取得できない場合は削除しない", async () => {
			const { handler, communityLogicMock, userLogicMock } = setupHandlerWithMocks(UserRemoveHandler);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

			const member = { id: "123", guild: { id: "456" } } as any;
			await handler.handle(member);

			verify(userLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).never();
		});

		it("UserLogic.deleteByCommunityIdAndClientId → UserRepositoryImpl.deleteByCommunityIdAndClientIdが呼ばれる", async () => {
			const handler = new UserRemoveHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(101);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			when(userLogicMock.deleteByCommunityIdAndClientId(anything() as any, anything() as any)).thenResolve(true);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const member = { id: "901", guild: { id: "777" } } as any;
			await handler.handle(member);

			verify(userLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).once();

			const originalDestroy = UserRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(UserRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};
			await UserRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as UserRepositoryImpl,
				new UserCommunityId(communityId.getValue()),
				new UserClientId(BigInt("901")),
			);

			expect(receivedWhere).to.deep.equal({
				clientId: BigInt("901"),
				communityId: communityId.getValue(),
			});

			(UserRepositoryImpl as any).destroy = originalDestroy;
		});

		it("communityId / clientId 条件で1件削除される", async () => {
			const originalDestroy = UserRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(UserRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await UserRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as UserRepositoryImpl,
				new UserCommunityId(5),
				new UserClientId(BigInt(6)),
			);

			expect(receivedWhere).to.deep.equal({
				clientId: BigInt(6),
				communityId: 5,
			});
			(UserRepositoryImpl as any).destroy = originalDestroy;
		});
	});

	/**
	 * 3) UserRepository関連のテスト
	 */
	describe("3) UserRepository", () => {
		it("UserRepositoryImpl.bulkCreateがbatchStatus=Yetで作成される", async () => {
			const originalBulkCreate = UserRepositoryImpl.bulkCreate;
			let receivedRows: any[] = [];
			(UserRepositoryImpl as any).bulkCreate = (rows: any[]) => {
				receivedRows = rows;
				return Promise.resolve(rows);
			};

			await UserRepositoryImpl.prototype.bulkCreate.call({} as UserRepositoryImpl, [
				new UserDto(UserCategoryType.Discord, new UserClientId(BigInt(10)), UserType.user, new UserCommunityId(20)),
			]);

			expect(receivedRows[0].batchStatus).to.equal(UserBatchStatus.Yet.getValue());
			(UserRepositoryImpl as any).bulkCreate = originalBulkCreate;
		});

		it("UserRepositoryImpl.delete系はcommunityIdとclientId条件が適用される", async () => {
			const originalDestroy = UserRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(UserRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await UserRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as UserRepositoryImpl,
				new UserCommunityId(11),
				new UserClientId(BigInt(22)),
			);

			expect(receivedWhere).to.deep.equal({
				clientId: BigInt(22),
				communityId: 11,
			});

			(UserRepositoryImpl as any).destroy = originalDestroy;
		});

		it("UserRepositoryImpl.delete系のcommunityId/clientId条件が適用される", async () => {
			const originalDestroy = UserRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(UserRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await UserRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as UserRepositoryImpl,
				new UserCommunityId(1),
				new UserClientId(BigInt(2)),
			);

			expect(receivedWhere.communityId).to.equal(1);
			expect(receivedWhere.clientId).to.equal(BigInt(2));
			(UserRepositoryImpl as any).destroy = originalDestroy;
		});

		it("UserRepositoryImpl.deleteNotBelongByCommunityIdAndClientIdsはNOT IN条件が適用される", async () => {
			const originalDestroy = UserRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(UserRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await UserRepositoryImpl.prototype.deleteNotBelongByCommunityIdAndClientIds.call({} as UserRepositoryImpl, new UserCommunityId(9), [
				new UserClientId(BigInt(10)),
				new UserClientId(BigInt(11)),
			]);

			expect(receivedWhere.communityId).to.equal(9);
			expect(receivedWhere.clientId[Op.notIn]).to.deep.equal([BigInt(10), BigInt(11)]);

			(UserRepositoryImpl as any).destroy = originalDestroy;
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

			const guild = createGuildMock("100", [], []);
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

			const handler = new UserAddHandler();
			const handlerLogger = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			when(communityLogicMock.getId(anything() as any)).thenThrow(new Error("handler error"));

			(handler as any).logger = instance(handlerLogger);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const member = {
				id: "999",
				guild: { id: "888" },
			} as any;
			await handler.handle(member);

			verify(handlerLogger.error("UserAddHandler error: Error: handler error")).once();
		});
	});
});
