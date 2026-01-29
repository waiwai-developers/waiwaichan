import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { UserBatchStatus } from "@/src/entities/vo/UserBatchStatus";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import { BotAddHandler } from "@/src/handlers/discord.js/events/BotAddHandler";
import { BotRemoveHandler } from "@/src/handlers/discord.js/events/BotRemoveHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
import { BotAddRouter } from "@/src/routes/discordjs/events/BotAddRouter";
import { BotRemoveRouter } from "@/src/routes/discordjs/events/BotRemoveRouter";
import { expect } from "chai";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Community event integration tests", () => {
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
		createResult?: CommunityId | null;
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
		deleteByCommunityIdResult?: boolean;
	}) => {
		const mock_ = mock<IUserLogic>();
		if (overrides?.bulkCreateResult !== undefined) {
			when(mock_.bulkCreate(anything() as any)).thenResolve(overrides.bulkCreateResult);
		}
		if (overrides?.deleteByCommunityIdResult !== undefined) {
			when(mock_.deletebyCommunityId(anything() as any)).thenResolve(overrides.deleteByCommunityIdResult);
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
	 * 1) BotAddRouter / BotAddHandler (Community作成)
	 */
	describe("1) BotAddRouter / BotAddHandler", () => {
		it("guildCreateでRouterがHandlerを呼び出す", async () => {
			const handlerMock = mock<BotAddHandler>();
			const guild = createGuildMock("100");
			await setupRouterAndVerifyHandlerCall(BotAddRouter, handlerMock, "guildCreate", guild);
			verify(handlerMock.handle(guild)).once();
		});

		it("ログにguildIdが出力される", async () => {
			const router = new BotAddRouter();
			const loggerMock = createLoggerMock();
			const handlerMock = mock<BotAddHandler>();
			when(handlerMock.handle(anything())).thenResolve();

			injectRouterDependencies(router, {
				logger: instance(loggerMock),
				handler: instance(handlerMock),
			});

			const guild = createGuildMock("456");
			await testEventRegistration(router, "guildCreate", guild);
			verify(loggerMock.info(`Bot is added to new server for guildIs: ${guild.id}.`)).once();
		});

		it("CommunityLogic.createが呼ばれ、CommunityRepositoryImpl.createがinsertする", async () => {
			const handler = new BotAddHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const channelLogicMock = mock<IChannelLogic>();
			const communityId = new CommunityId(12);

			(when(communityLogicMock.create(anything()) as any) as any).thenCall((dto: CommunityDto) => {
				expect(dto.categoryType.getValue()).to.equal(CommunityCategoryType.Discord.getValue());
				expect(dto.clientId.getValue()).to.equal(BigInt("200"));
				return Promise.resolve(communityId);
			});
			when(userLogicMock.bulkCreate(anything() as any)).thenResolve(true);
			when(channelLogicMock.bulkCreate(anything() as any)).thenResolve(true);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);
			(handler as any).ChannelLogic = instance(channelLogicMock);

			const guild = createGuildMock("200", [], []);

			await handler.handle(guild);
			verify(communityLogicMock.create(anything())).once();

			const originalCreate = CommunityRepositoryImpl.create;
			let receivedData: any = null;
			(CommunityRepositoryImpl as any).create = (data: any) => {
				receivedData = data;
				return Promise.resolve({ id: 99 });
			};
			const result = await CommunityRepositoryImpl.prototype.create.call(
				{} as CommunityRepositoryImpl,
				new CommunityDto(CommunityCategoryType.Discord, new CommunityClientId(BigInt("300"))),
			);

			expect(result.getValue()).to.equal(99);
			expect(receivedData).to.deep.equal({
				categoryType: CommunityCategoryType.Discord.getValue(),
				clientId: BigInt("300"),
				batchStatus: 0,
			});

			(CommunityRepositoryImpl as any).create = originalCreate;
		});

		it("Community作成失敗時にUser作成がスキップされる", async () => {
			const handler = new BotAddHandler();
			const communityLogicMock = createCommunityLogicMock({ createResult: null });
			const userLogicMock = createUserLogicMock();
			const channelLogicMock = createChannelLogicMock();

			injectHandlerDependencies(handler, {
				logger: instance(createLoggerMock()),
				communityLogic: instance(communityLogicMock),
				userLogic: instance(userLogicMock),
				channelLogic: instance(channelLogicMock),
			});

			const guild = createGuildMock("300", []);
			await handler.handle(guild);
			verify(userLogicMock.bulkCreate(anything())).never();
		});

		it("guild.members.fetch() の結果全員がUserDtoに変換される", async () => {
			const handler = new BotAddHandler();
			const communityId = new CommunityId(22);
			const communityLogicMock = createCommunityLogicMock({ createResult: communityId });

			let receivedUsers: UserDto[] = [];
			const userLogicMock = createUserLogicMock();
			when(userLogicMock.bulkCreate(anything() as any)).thenCall((users: UserDto[]) => {
				receivedUsers = users;
				return Promise.resolve(true);
			});

			const channelLogicMock = createChannelLogicMock({ bulkCreateResult: true });

			injectHandlerDependencies(handler, {
				logger: instance(createLoggerMock()),
				communityLogic: instance(communityLogicMock),
				userLogic: instance(userLogicMock),
				channelLogic: instance(channelLogicMock),
			});

			const guild = createGuildMock(
				"555",
				[
					{ id: "10", user: { bot: false } },
					{ id: "11", user: { bot: true } },
				],
				[],
			);

			await handler.handle(guild);
			expect(receivedUsers).to.have.length(2);
			expect(receivedUsers.map((u) => u.clientId.getValue())).to.deep.equal([BigInt("10"), BigInt("11")]);
		});

		it("botメンバーはUserType.bot、通常ユーザーはUserType.userになる", async () => {
			const handler = new BotAddHandler();
			const communityId = new CommunityId(23);
			const communityLogicMock = createCommunityLogicMock({ createResult: communityId });

			let receivedUsers: UserDto[] = [];
			const userLogicMock = createUserLogicMock();
			when(userLogicMock.bulkCreate(anything() as any)).thenCall((users: UserDto[]) => {
				receivedUsers = users;
				return Promise.resolve(true);
			});

			const channelLogicMock = createChannelLogicMock({ bulkCreateResult: true });

			injectHandlerDependencies(handler, {
				logger: instance(createLoggerMock()),
				communityLogic: instance(communityLogicMock),
				userLogic: instance(userLogicMock),
				channelLogic: instance(channelLogicMock),
			});

			const guild = createGuildMock(
				"700",
				[
					{ id: "21", user: { bot: false } },
					{ id: "22", user: { bot: true } },
				],
				[],
			);

			await handler.handle(guild);
			expect(receivedUsers[0]?.userType.getValue()).to.equal(UserType.user.getValue());
			expect(receivedUsers[1]?.userType.getValue()).to.equal(UserType.bot.getValue());
		});

		it("UserLogic.bulkCreate → UserRepositoryImpl.bulkCreateで複数レコードが作成される", async () => {
			const handler = new BotAddHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const channelLogicMock = mock<IChannelLogic>();
			const communityId = new CommunityId(24);
			when(communityLogicMock.create(anything() as any)).thenResolve(communityId);
			when(userLogicMock.bulkCreate(anything() as any)).thenResolve(true);
			when(channelLogicMock.bulkCreate(anything() as any)).thenResolve(true);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);
			(handler as any).ChannelLogic = instance(channelLogicMock);

			const guild = createGuildMock(
				"888",
				[
					{ id: "31", user: { bot: false } },
					{ id: "32", user: { bot: true } },
				],
				[],
			);

			await handler.handle(guild);
			verify(userLogicMock.bulkCreate(anything())).once();

			const originalBulkCreate = UserRepositoryImpl.bulkCreate;
			let receivedRows: any[] = [];
			(UserRepositoryImpl as any).bulkCreate = (rows: any[]) => {
				receivedRows = rows;
				return Promise.resolve(rows);
			};

			await UserRepositoryImpl.prototype.bulkCreate.call({} as UserRepositoryImpl, [
				new UserDto(UserCategoryType.Discord, new UserClientId(BigInt("40")), UserType.user, new UserCommunityId(communityId.getValue())),
				new UserDto(UserCategoryType.Discord, new UserClientId(BigInt("41")), UserType.bot, new UserCommunityId(communityId.getValue())),
			]);

			expect(receivedRows).to.have.length(2);
			expect(receivedRows[0].batchStatus).to.equal(UserBatchStatus.Yet.getValue());
			expect(receivedRows[1].batchStatus).to.equal(UserBatchStatus.Yet.getValue());

			(UserRepositoryImpl as any).bulkCreate = originalBulkCreate;
		});
	});

	/**
	 * 2) BotRemoveRouter / BotRemoveHandler (Community削除)
	 */
	describe("2) BotRemoveRouter / BotRemoveHandler", () => {
		it("guildDeleteでRouterがHandlerを呼び出す", async () => {
			const handlerMock = mock<BotRemoveHandler>();
			const guild = createGuildMock("600");
			await setupRouterAndVerifyHandlerCall(BotRemoveRouter, handlerMock, "guildDelete", guild);
			verify(handlerMock.handle(guild)).once();
		});

		it("CommunityLogic.getIdでCommunityIdが取得できない場合は処理を終了する", async () => {
			const { handler, communityLogicMock, userLogicMock, channelLogicMock } = setupHandlerWithMocks(BotRemoveHandler);
			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

			const guild = { id: "800" } as any;
			await handler.handle(guild);

			verify(communityLogicMock.delete(anything())).never();
			verify(userLogicMock.deletebyCommunityId(anything())).never();
			verify(channelLogicMock.deletebyCommunityId(anything())).never();
		});

		it("CommunityLogic.deleteが先に実行される", async () => {
			const handler = new BotRemoveHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const channelLogicMock = mock<IChannelLogic>();
			const communityId = new CommunityId(66);
			const callOrder: string[] = [];

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			when(communityLogicMock.delete(anything() as any)).thenCall(() => {
				callOrder.push("communityDelete");
				return Promise.resolve(true);
			});
			when(userLogicMock.deletebyCommunityId(anything() as any)).thenCall(() => {
				callOrder.push("userDelete");
				return Promise.resolve(true);
			});
			when(channelLogicMock.deletebyCommunityId(anything() as any)).thenCall(() => {
				callOrder.push("channelDelete");
				return Promise.resolve(true);
			});

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);
			(handler as any).ChannelLogic = instance(channelLogicMock);

			const guild = { id: "600" } as any;
			await handler.handle(guild);

			expect(callOrder).to.deep.equal(["communityDelete", "userDelete", "channelDelete"]);
		});

		it("Community削除に失敗した場合、User削除が実行されない", async () => {
			const { handler, communityLogicMock, userLogicMock, channelLogicMock } = setupHandlerWithMocks(BotRemoveHandler);
			const communityId = new CommunityId(66);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			when(communityLogicMock.delete(anything() as any)).thenResolve(false);

			const guild = { id: "901" } as any;
			await handler.handle(guild);

			verify(userLogicMock.deletebyCommunityId(anything())).never();
			verify(channelLogicMock.deletebyCommunityId(anything())).never();
		});
	});

	/**
	 * 3) CommunityRepository関連のテスト
	 */
	describe("3) CommunityRepository", () => {
		it("CommunityRepositoryImpl.create/delete/getId のDB条件が一致している", async () => {
			const originalCreate = CommunityRepositoryImpl.create;
			const originalDestroy = CommunityRepositoryImpl.destroy;
			const originalFindOne = CommunityRepositoryImpl.findOne;
			let createData: any = null;
			let deleteWhere: any = null;
			let findWhere: any = null;

			(CommunityRepositoryImpl as any).create = (data: any) => {
				createData = data;
				return Promise.resolve({ id: 1 });
			};
			(CommunityRepositoryImpl as any).destroy = (options: any) => {
				deleteWhere = options.where;
				return Promise.resolve(1);
			};
			(CommunityRepositoryImpl as any).findOne = (options: any) => {
				findWhere = options.where;
				return Promise.resolve({ id: 1 });
			};

			const dto = new CommunityDto(CommunityCategoryType.Discord, new CommunityClientId(BigInt(777)));
			await CommunityRepositoryImpl.prototype.create.call({} as CommunityRepositoryImpl, dto);
			await CommunityRepositoryImpl.prototype.delete.call({} as CommunityRepositoryImpl, dto);
			await CommunityRepositoryImpl.prototype.getId.call({} as CommunityRepositoryImpl, dto);

			expect(deleteWhere).to.deep.equal({
				categoryType: dto.categoryType.getValue(),
				clientId: dto.clientId.getValue(),
			});
			expect(findWhere).to.deep.equal(deleteWhere);
			expect(createData.categoryType).to.equal(dto.categoryType.getValue());
			expect(createData.clientId).to.equal(dto.clientId.getValue());

			(CommunityRepositoryImpl as any).create = originalCreate;
			(CommunityRepositoryImpl as any).destroy = originalDestroy;
			(CommunityRepositoryImpl as any).findOne = originalFindOne;
		});

		it("CommunityRepositoryImplのgetId/delete条件はcategoryTypeとclientIdが一致する", async () => {
			const originalFindOne = CommunityRepositoryImpl.findOne;
			const originalDestroy = CommunityRepositoryImpl.destroy;
			let findWhere: any = null;
			let deleteWhere: any = null;

			(CommunityRepositoryImpl as any).findOne = (options: any) => {
				findWhere = options.where;
				return Promise.resolve({ id: 1 });
			};
			(CommunityRepositoryImpl as any).destroy = (options: any) => {
				deleteWhere = options.where;
				return Promise.resolve(1);
			};

			const dto = new CommunityDto(CommunityCategoryType.Discord, new CommunityClientId(BigInt(99)));
			await CommunityRepositoryImpl.prototype.getId.call({} as CommunityRepositoryImpl, dto);
			await CommunityRepositoryImpl.prototype.delete.call({} as CommunityRepositoryImpl, dto);

			expect(findWhere).to.deep.equal({
				categoryType: dto.categoryType.getValue(),
				clientId: dto.clientId.getValue(),
			});
			expect(deleteWhere).to.deep.equal(findWhere);

			(CommunityRepositoryImpl as any).findOne = originalFindOne;
			(CommunityRepositoryImpl as any).destroy = originalDestroy;
		});
	});
});
