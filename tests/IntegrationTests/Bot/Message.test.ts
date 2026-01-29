import { AppConfig } from "@/src/entities/config/AppConfig";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { MessageClientId } from "@/src/entities/vo/MessageClientId";
import { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import { MessageDeleteHandler } from "@/src/handlers/discord.js/events/MessageDeleteHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { MessageRepositoryImpl } from "@/src/repositories/sequelize-mysql/MessageRepositoryImpl";
import { MessageDeleteRouter } from "@/src/routes/discordjs/events/MessageDeleteRouter";
import { expect } from "chai";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Message delete event integration tests", () => {
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

	const createMessageMock = (messageId: string, guildId: string, authorId?: string): any => ({
		id: messageId,
		guild: { id: guildId },
		author: authorId ? { id: authorId } : null,
	});

	const createDMMessageMock = (messageId: string): any => ({
		id: messageId,
		guild: null,
		author: { id: "123" },
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
			messageLogic?: IMessageLogic;
		},
	): T => {
		if (deps.logger) (handler as any).logger = deps.logger;
		if (deps.communityLogic) (handler as any).CommunityLogic = deps.communityLogic;
		if (deps.messageLogic) (handler as any).MessageLogic = deps.messageLogic;
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
		messageLogicMock: IMessageLogic;
	} => {
		const loggerMock = createLoggerMock();
		const communityLogicMock = mock<ICommunityLogic>();
		const messageLogicMock = mock<IMessageLogic>();
		const handler = new HandlerClass();
		injectHandlerDependencies(handler, {
			logger: instance(loggerMock),
			communityLogic: instance(communityLogicMock),
			messageLogic: instance(messageLogicMock),
		});
		return { handler, loggerMock, communityLogicMock, messageLogicMock };
	};

	/**
	 * 1) MessageDeleteRouter / MessageDeleteHandler (Message削除)
	 */
	describe("1) MessageDeleteRouter / MessageDeleteHandler", () => {
		/**
		 * Router関連テスト
		 */
		describe("Router", () => {
			it("messageDeleteでRouterがHandlerを呼び出す", async () => {
				const handlerMock = mock<MessageDeleteHandler>();
				const message = createMessageMock("501", "500");
				await setupRouterAndVerifyHandlerCall(MessageDeleteRouter, handlerMock, "messageDelete", message);
				verify(handlerMock.handle(message)).once();
			});

			it("guildがnullの場合はHandlerが呼ばれない", async () => {
				const router = new MessageDeleteRouter();
				const loggerMock = createLoggerMock();
				const handlerMock = mock<MessageDeleteHandler>();

				injectRouterDependencies(router, {
					logger: instance(loggerMock),
					handler: instance(handlerMock),
				});

				const dmMessage = createDMMessageMock("777");
				await testEventRegistration(router, "messageDelete", dmMessage);

				verify(handlerMock.handle(anything())).never();
			});
		});

		/**
		 * Handler関連テスト
		 */
		describe("Handler", () => {
			it("guildがnullの場合は処理がスキップされる", async () => {
				const { handler, communityLogicMock, messageLogicMock } = setupHandlerWithMocks(MessageDeleteHandler);

				const dmMessage = createDMMessageMock("111");

				await handler.handle(dmMessage);

				verify(communityLogicMock.getId(anything())).never();
				verify(messageLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).never();
			});

			it("CommunityLogic.getIdが取得できない場合は削除しない", async () => {
				const { handler, communityLogicMock, messageLogicMock } = setupHandlerWithMocks(MessageDeleteHandler);

				(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

				const message = createMessageMock("123", "456", "789");
				await handler.handle(message);

				verify(communityLogicMock.getId(anything())).once();
				verify(messageLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).never();
			});

			it("MessageLogic.deleteByCommunityIdAndClientIdが正しく呼ばれる", async () => {
				const { handler, communityLogicMock, messageLogicMock } = setupHandlerWithMocks(MessageDeleteHandler);
				const communityId = new CommunityId(101);

				(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
				when(messageLogicMock.deleteByCommunityIdAndClientId(anything() as any, anything() as any)).thenResolve(true);

				const message = createMessageMock("901", "777", "888");
				await handler.handle(message);

				verify(messageLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).once();
			});

			it("deleteByCommunityIdAndClientIdがfalseを返した場合、処理が停止する", async () => {
				const { handler, communityLogicMock, messageLogicMock } = setupHandlerWithMocks(MessageDeleteHandler);
				const communityId = new CommunityId(101);

				(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
				when(messageLogicMock.deleteByCommunityIdAndClientId(anything() as any, anything() as any)).thenResolve(false);

				const message = createMessageMock("901", "777", "888");
				await handler.handle(message);

				verify(messageLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).once();
			});

			it("authorがnullでも処理が継続される", async () => {
				const { handler, communityLogicMock, messageLogicMock } = setupHandlerWithMocks(MessageDeleteHandler);
				const communityId = new CommunityId(101);

				(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
				when(messageLogicMock.deleteByCommunityIdAndClientId(anything() as any, anything() as any)).thenResolve(true);

				// authorがnullのメッセージ（PartialMessage）
				const partialMessage = createMessageMock("901", "777");

				await handler.handle(partialMessage);

				verify(communityLogicMock.getId(anything())).once();
				verify(messageLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).once();
			});
		});
	});

	/**
	 * 2) MessageRepository関連のテスト
	 */
	describe("2) MessageRepository", () => {
		it("MessageRepositoryImpl.deleteByCommunityIdAndClientIdはcommunityIdとclientId条件が適用される", async () => {
			const originalDestroy = MessageRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(MessageRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await MessageRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as MessageRepositoryImpl,
				new MessageCommunityId(11),
				new MessageClientId(BigInt(22)),
			);

			expect(receivedWhere).to.deep.equal({
				clientId: BigInt(22),
				communityId: 11,
			});

			(MessageRepositoryImpl as any).destroy = originalDestroy;
		});
	});

	/**
	 * 3) エラー処理テスト
	 */
	describe("3) Error handling", () => {
		it("Router例外発生時にログに出力される", async () => {
			const router = new MessageDeleteRouter();
			const routerLogger = createLoggerMock();
			const handlerMock = mock<MessageDeleteHandler>();
			when(handlerMock.handle(anything())).thenThrow(new Error("boom"));

			injectRouterDependencies(router, {
				logger: instance(routerLogger),
				handler: instance(handlerMock),
			});

			const message = createMessageMock("100", "200");
			let registeredCallback: ((c: any) => Promise<void>) | null = null;
			const client = {
				on: (event: string, callback: (c: any) => Promise<void>) => {
					if (event === "messageDelete") {
						registeredCallback = callback;
					}
				},
			} as any;

			router.register(client);
			if (!registeredCallback) {
				throw new Error("messageDelete handler was not registered");
			}
			await (registeredCallback as (payload: any) => Promise<void>)(message);

			verify(routerLogger.error("Error: Error: boom")).once();
		});

		it("Handler例外発生時にログに出力される", async () => {
			const handler = new MessageDeleteHandler();
			const handlerLogger = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const messageLogicMock = mock<IMessageLogic>();
			when(communityLogicMock.getId(anything() as any)).thenThrow(new Error("handler error"));

			injectHandlerDependencies(handler, {
				logger: instance(handlerLogger),
				communityLogic: instance(communityLogicMock),
				messageLogic: instance(messageLogicMock),
			});

			const message = createMessageMock("999", "888", "777");
			await handler.handle(message);

			verify(handlerLogger.error("ActionRemoveMessageHandler error: Error: handler error")).once();
		});
	});
});
