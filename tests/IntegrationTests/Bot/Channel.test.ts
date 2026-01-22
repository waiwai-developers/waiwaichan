import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { ChannelBatchStatus } from "@/src/entities/vo/ChannelBatchStatus";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { ChannelCreateHandler } from "@/src/handlers/discord.js/events/ChannelCreateHandler";
import { ChannelDeleteHandler } from "@/src/handlers/discord.js/events/ChannelDeleteHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { ChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/ChannelRepositoryImpl";
import { ActionAddChannelRouter } from "@/src/routes/discordjs/events/ActionAddChannelRouter";
import { ActionRemoveChannelRouter } from "@/src/routes/discordjs/events/ActionRemoveChannelRoute";
import { expect } from "chai";
import { ChannelType as DiscordChannelType } from "discord.js";
import { Op } from "sequelize";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Channel event integration tests", () => {
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

	const createChannelLogicMock = (overrides?: {
		bulkCreateResult?: boolean;
		deleteByCommunityIdAndClientIdResult?: boolean;
	}) => {
		const mock_ = mock<IChannelLogic>();
		if (overrides?.bulkCreateResult !== undefined) {
			when(mock_.bulkCreate(anything() as any)).thenResolve(overrides.bulkCreateResult);
		}
		if (overrides?.deleteByCommunityIdAndClientIdResult !== undefined) {
			when(mock_.deleteByCommunityIdAndClientId(anything() as any, anything() as any)).thenResolve(overrides.deleteByCommunityIdAndClientIdResult);
		}
		return mock_;
	};

	const createChannelMock = (channelId: string, guildId: string, channelType: DiscordChannelType = DiscordChannelType.GuildText): any => ({
		id: channelId,
		guild: { id: guildId },
		type: channelType,
		isDMBased: () => false,
	});

	const createDMChannelMock = (channelId: string): any => ({
		id: channelId,
		isDMBased: () => true,
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
			channelLogic?: IChannelLogic;
		},
	): T => {
		if (deps.logger) (handler as any).logger = deps.logger;
		if (deps.communityLogic) (handler as any).CommunityLogic = deps.communityLogic;
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
		channelLogicMock: IChannelLogic;
	} => {
		const loggerMock = createLoggerMock();
		const communityLogicMock = mock<ICommunityLogic>();
		const channelLogicMock = mock<IChannelLogic>();
		const handler = new HandlerClass();
		injectHandlerDependencies(handler, {
			logger: instance(loggerMock),
			communityLogic: instance(communityLogicMock),
			channelLogic: instance(channelLogicMock),
		});
		return { handler, loggerMock, communityLogicMock, channelLogicMock };
	};

	/**
	 * 1) ActionAddChannelRouter / ChannelCreateHandler (Channel追加)
	 */
	describe("1) ActionAddChannelRouter / ChannelCreateHandler", () => {
		it("channelCreateでRouterがHandlerを呼び出す", async () => {
			const handlerMock = mock<ChannelCreateHandler>();
			const channel = createChannelMock("501", "500");
			await setupRouterAndVerifyHandlerCall(ActionAddChannelRouter, handlerMock, "channelCreate", channel);
			verify(handlerMock.handle(channel)).once();
		});

		it("DMチャンネルの作成イベントは処理がスキップされる", async () => {
			const router = new ActionAddChannelRouter();
			const loggerMock = createLoggerMock();
			const handlerMock = mock<ChannelCreateHandler>();

			injectRouterDependencies(router, {
				logger: instance(loggerMock),
				handler: instance(handlerMock),
			});

			const dmChannel = createDMChannelMock("777");
			await testEventRegistration(router, "channelCreate", dmChannel);

			verify(handlerMock.handle(anything())).never();
		});

		it("CommunityLogic.getIdが呼ばれ、未登録Communityでは処理停止する", async () => {
			const { handler, communityLogicMock, channelLogicMock } = setupHandlerWithMocks(ChannelCreateHandler);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

			const channel = createChannelMock("900", "901");

			await handler.handle(channel);

			verify(communityLogicMock.getId(anything())).once();
			verify(channelLogicMock.bulkCreate(anything())).never();
		});

		it("ChannelLogic.bulkCreateが1件のみで実行される", async () => {
			const { handler, communityLogicMock, channelLogicMock } = setupHandlerWithMocks(ChannelCreateHandler);
			const communityId = new CommunityId(99);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			let receivedChannels: ChannelDto[] = [];
			when(channelLogicMock.bulkCreate(anything() as any)).thenCall((channels: ChannelDto[]) => {
				receivedChannels = channels;
				return Promise.resolve(true);
			});

			const channel = createChannelMock("888", "777");

			await handler.handle(channel);

			expect(receivedChannels).to.have.length(1);
			verify(channelLogicMock.bulkCreate(anything())).once();
		});

		it("ChannelDtoのcategoryType/clientId/communityIdが正しい", async () => {
			const { handler, communityLogicMock, channelLogicMock } = setupHandlerWithMocks(ChannelCreateHandler);
			const communityId = new CommunityId(77);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			let receivedChannels: ChannelDto[] = [];
			when(channelLogicMock.bulkCreate(anything() as any)).thenCall((channels: ChannelDto[]) => {
				receivedChannels = channels;
				return Promise.resolve(true);
			});

			const channel = createChannelMock("2001", "2002");

			await handler.handle(channel);

			const channelDto = receivedChannels[0];
			expect(channelDto.categoryType.getValue()).to.equal(ChannelCategoryType.Discord.getValue());
			expect(channelDto.clientId.getValue()).to.equal(BigInt("2001"));
			expect(channelDto.communityId.getValue()).to.equal(communityId.getValue());
		});

		it("各種DiscordChannelTypeが正しくChannelTypeに変換される", async () => {
			const testCases = [
				{ discordType: DiscordChannelType.GuildText, expectedType: ChannelType.DiscordText },
				{ discordType: DiscordChannelType.GuildVoice, expectedType: ChannelType.DiscordVoice },
				{ discordType: DiscordChannelType.GuildCategory, expectedType: ChannelType.DiscordCategory },
				{ discordType: DiscordChannelType.GuildAnnouncement, expectedType: ChannelType.DiscordAnnouncement },
				{ discordType: DiscordChannelType.GuildForum, expectedType: ChannelType.DiscordForum },
				{ discordType: DiscordChannelType.PublicThread, expectedType: ChannelType.DiscordPublicThread },
				{ discordType: DiscordChannelType.PrivateThread, expectedType: ChannelType.DiscordPrivateThread },
			];

			for (const testCase of testCases) {
				const { handler, communityLogicMock, channelLogicMock } = setupHandlerWithMocks(ChannelCreateHandler);
				const communityId = new CommunityId(77);

				(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
				let receivedChannels: ChannelDto[] = [];
				when(channelLogicMock.bulkCreate(anything() as any)).thenCall((channels: ChannelDto[]) => {
					receivedChannels = channels;
					return Promise.resolve(true);
				});

				const channel = createChannelMock("3001", "3002", testCase.discordType);
				await handler.handle(channel);

				const channelDto = receivedChannels[0];
				expect(channelDto.channelType.getValue()).to.equal(testCase.expectedType.getValue());
			}
		});

		it("失敗時（bulkCreate=false）に後続処理は行われない", async () => {
			const { handler, communityLogicMock, channelLogicMock } = setupHandlerWithMocks(ChannelCreateHandler);
			const communityId = new CommunityId(55);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			when(channelLogicMock.bulkCreate(anything() as any)).thenResolve(false);

			const channel = createChannelMock("3001", "3002");

			await handler.handle(channel);

			verify(channelLogicMock.bulkCreate(anything())).once();
		});
	});

	/**
	 * 2) ActionRemoveChannelRouter / ChannelDeleteHandler (Channel削除)
	 */
	describe("2) ActionRemoveChannelRouter / ChannelDeleteHandler", () => {
		it("channelDeleteでRouterがHandlerを呼び出す", async () => {
			const handlerMock = mock<ChannelDeleteHandler>();
			const channel = createChannelMock("701", "700");
			await setupRouterAndVerifyHandlerCall(ActionRemoveChannelRouter, handlerMock, "channelDelete", channel);
			verify(handlerMock.handle(channel)).once();
		});

		it("DMチャンネルの削除イベントは処理がスキップされる", async () => {
			const { handler, communityLogicMock, channelLogicMock } = setupHandlerWithMocks(ChannelDeleteHandler);

			const dmChannel = createDMChannelMock("111");

			await handler.handle(dmChannel);

			verify(communityLogicMock.getId(anything())).never();
			verify(channelLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).never();
		});

		it("CommunityLogic.getIdが取得できない場合は削除しない", async () => {
			const { handler, communityLogicMock, channelLogicMock } = setupHandlerWithMocks(ChannelDeleteHandler);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

			const channel = createChannelMock("123", "456");
			await handler.handle(channel);

			verify(channelLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).never();
		});

		it("ChannelLogic.deleteByCommunityIdAndClientId → ChannelRepositoryImpl.deleteByCommunityIdAndClientIdが呼ばれる", async () => {
			const handler = new ChannelDeleteHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const channelLogicMock = mock<IChannelLogic>();
			const communityId = new CommunityId(101);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			when(channelLogicMock.deleteByCommunityIdAndClientId(anything() as any, anything() as any)).thenResolve(true);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).ChannelLogic = instance(channelLogicMock);

			const channel = createChannelMock("901", "777");
			await handler.handle(channel);

			verify(channelLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).once();

			const originalDestroy = ChannelRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(ChannelRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};
			await ChannelRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as ChannelRepositoryImpl,
				new ChannelCommunityId(communityId.getValue()),
				new ChannelClientId(BigInt("901")),
			);

			expect(receivedWhere).to.deep.equal({
				clientId: BigInt("901"),
				communityId: communityId.getValue(),
			});

			(ChannelRepositoryImpl as any).destroy = originalDestroy;
		});

		it("communityId / clientId 条件で1件削除される", async () => {
			const originalDestroy = ChannelRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(ChannelRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await ChannelRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as ChannelRepositoryImpl,
				new ChannelCommunityId(5),
				new ChannelClientId(BigInt(6)),
			);

			expect(receivedWhere).to.deep.equal({
				clientId: BigInt(6),
				communityId: 5,
			});
			(ChannelRepositoryImpl as any).destroy = originalDestroy;
		});
	});

	/**
	 * 3) ChannelRepository関連のテスト
	 */
	describe("3) ChannelRepository", () => {
		it("ChannelRepositoryImpl.bulkCreateがbatchStatus=Yetで作成される", async () => {
			const originalBulkCreate = ChannelRepositoryImpl.bulkCreate;
			let receivedRows: any[] = [];
			(ChannelRepositoryImpl as any).bulkCreate = (rows: any[]) => {
				receivedRows = rows;
				return Promise.resolve(rows);
			};

			await ChannelRepositoryImpl.prototype.bulkCreate.call({} as ChannelRepositoryImpl, [
				new ChannelDto(ChannelCategoryType.Discord, new ChannelClientId(BigInt(10)), ChannelType.DiscordText, new ChannelCommunityId(20)),
			]);

			expect(receivedRows[0].batchStatus).to.equal(ChannelBatchStatus.Yet.getValue());
			(ChannelRepositoryImpl as any).bulkCreate = originalBulkCreate;
		});

		it("ChannelRepositoryImpl.delete系はcommunityIdとclientId条件が適用される", async () => {
			const originalDestroy = ChannelRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(ChannelRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await ChannelRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as ChannelRepositoryImpl,
				new ChannelCommunityId(11),
				new ChannelClientId(BigInt(22)),
			);

			expect(receivedWhere).to.deep.equal({
				clientId: BigInt(22),
				communityId: 11,
			});

			(ChannelRepositoryImpl as any).destroy = originalDestroy;
		});

		it("ChannelRepositoryImpl.delete系のcommunityId/clientId条件が適用される", async () => {
			const originalDestroy = ChannelRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(ChannelRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await ChannelRepositoryImpl.prototype.deleteByCommunityIdAndClientId.call(
				{} as ChannelRepositoryImpl,
				new ChannelCommunityId(1),
				new ChannelClientId(BigInt(2)),
			);

			expect(receivedWhere.communityId).to.equal(1);
			expect(receivedWhere.clientId).to.equal(BigInt(2));
			(ChannelRepositoryImpl as any).destroy = originalDestroy;
		});

		it("ChannelRepositoryImpl.deleteNotBelongByCommunityIdAndClientIdsはNOT IN条件が適用される", async () => {
			const originalDestroy = ChannelRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(ChannelRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await ChannelRepositoryImpl.prototype.deleteNotBelongByCommunityIdAndClientIds.call({} as ChannelRepositoryImpl, new ChannelCommunityId(9), [
				new ChannelClientId(BigInt(10)),
				new ChannelClientId(BigInt(11)),
			]);

			expect(receivedWhere.communityId).to.equal(9);
			expect(receivedWhere.clientId[Op.notIn]).to.deep.equal([BigInt(10), BigInt(11)]);

			(ChannelRepositoryImpl as any).destroy = originalDestroy;
		});

		it("ChannelRepositoryImpl.deletebyCommunityIdはcommunityId条件が適用される", async () => {
			const originalDestroy = ChannelRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(ChannelRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await ChannelRepositoryImpl.prototype.deletebyCommunityId.call({} as ChannelRepositoryImpl, new ChannelCommunityId(15));

			expect(receivedWhere.communityId).to.equal(15);
			(ChannelRepositoryImpl as any).destroy = originalDestroy;
		});
	});

	/**
	 * 4) エラー処理テスト
	 */
	describe("4) Error handling", () => {
		it("Router/Handlerで例外が発生した場合にログに出力される", async () => {
			const router = new ActionAddChannelRouter();
			const routerLogger = createLoggerMock();
			const handlerMock = mock<ChannelCreateHandler>();
			when(handlerMock.handle(anything())).thenThrow(new Error("boom"));

			(router as any).logger = instance(routerLogger);
			(router as any).handler = instance(handlerMock);

			const channel = createChannelMock("100", "200");
			let registeredCallback: ((c: any) => Promise<void>) | null = null;
			const client = {
				on: (event: string, callback: (c: any) => Promise<void>) => {
					if (event === "channelCreate") {
						registeredCallback = callback;
					}
				},
			} as any;

			router.register(client);
			if (!registeredCallback) {
				throw new Error("channelCreate handler was not registered");
			}
			await (registeredCallback as (payload: any) => Promise<void>)(channel);

			verify(routerLogger.error("Error: Error: boom")).once();

			const handler = new ChannelCreateHandler();
			const handlerLogger = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const channelLogicMock = mock<IChannelLogic>();
			when(communityLogicMock.getId(anything() as any)).thenThrow(new Error("handler error"));

			(handler as any).logger = instance(handlerLogger);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).ChannelLogic = instance(channelLogicMock);

			const channel2 = createChannelMock("999", "888");
			await handler.handle(channel2);

			verify(handlerLogger.error("ChannelCreateHandler error: Error: handler error")).once();
		});
	});
});
