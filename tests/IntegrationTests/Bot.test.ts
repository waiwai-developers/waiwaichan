import { AppConfig } from "@/src/entities/config/AppConfig";
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
import { ActionAddBotHandler } from "@/src/handlers/discord.js/events/ActionAddBotHandler";
import { ActionAddUserHandler } from "@/src/handlers/discord.js/events/ActionAddUserHandler";
import { ActionRemoveBotHandler } from "@/src/handlers/discord.js/events/ActionRemoveBotHandler";
import { ActionRemoveUserHandler } from "@/src/handlers/discord.js/events/ActionRemoveUserHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
import { ActionAddBotRouter } from "@/src/routes/discordjs/events/ActionAddBotRouter";
import { ActionAddUserRouter } from "@/src/routes/discordjs/events/ActionAddUserRouter";
import { ActionRemoveBotRouter } from "@/src/routes/discordjs/events/ActionRemoveBotRouter";
import { ActionRemoveUserRouter } from "@/src/routes/discordjs/events/ActionRemoveUserRouter";
import { expect } from "chai";
import { Op } from "sequelize";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Bot event integration tests", () => {
	const createLoggerMock = () => {
		const loggerMock = mock<ILogger>();
		when(loggerMock.info(anything())).thenCall(() => undefined);
		when(loggerMock.error(anything())).thenCall(() => undefined);
		return loggerMock;
	};

	const createMemberCollection = (items: { id: string; user: { bot: boolean } }[]) => ({
		map: (mapper: (member: { id: string; user: { bot: boolean } }) => any) => items.map(mapper),
	});

	/**
	 * 1) ActionAddBotRouter / ActionAddBotHandler
	 */
	describe("1) ActionAddBotRouter / ActionAddBotHandler", () => {
		/**
		 * [Router呼び出し] guildCreateでHandlerが呼び出される
		 * - router.registerがイベントを登録する
		 * - handler.handleが呼ばれる
		 */
		it("guildCreateでRouterがHandlerを呼び出す", async () => {
			const router = new ActionAddBotRouter();
			const loggerMock = createLoggerMock();
			const handlerMock = mock<ActionAddBotHandler>();

			(router as any).logger = instance(loggerMock);
			(router as any).handler = instance(handlerMock);

			const guild = { id: "100" } as any;
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

			verify(handlerMock.handle(guild)).once();
		});

		/**
		 * [ログ出力] guildIdがログに含まれる
		 * - routerでinfoログが出力される
		 */
		it("ログにguildIdが出力される", async () => {
			const router = new ActionAddBotRouter();
			const loggerMock = createLoggerMock();
			const handlerMock = mock<ActionAddBotHandler>();
			when(handlerMock.handle(anything())).thenResolve();

			(router as any).logger = instance(loggerMock);
			(router as any).handler = instance(handlerMock);

			const guild = { id: "456" } as any;
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

			verify(loggerMock.info(`Bot is added to new server for guildIs: ${guild.id}.`)).once();
		});

		/**
		 * [Community作成] CommunityLogic.create → Repository.create
		 * - CommunityDtoの値が正しい
		 * - Repository.createがinsert条件を持つ
		 */
		it("CommunityLogic.createが呼ばれ、CommunityRepositoryImpl.createがinsertする", async () => {
			const handler = new ActionAddBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(12);

			(when(communityLogicMock.create(anything()) as any) as any).thenCall((dto: CommunityDto) => {
				expect(dto.categoryType.getValue()).to.equal(CommunityCategoryType.Discord.getValue());
				expect(dto.clientId.getValue()).to.equal(BigInt("200"));
				return Promise.resolve(communityId);
			});
			when(userLogicMock.bulkCreate(anything() as any)).thenResolve(true);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = {
				id: "200",
				members: {
					fetch: async () => createMemberCollection([]),
				},
			} as any;

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

		/**
		 * [Community失敗] Community作成失敗時にUser作成をスキップ
		 * - UserLogic.bulkCreateが呼ばれない
		 */
		it("Community作成失敗時にUser作成がスキップされる", async () => {
			const handler = new ActionAddBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();

			when(communityLogicMock.create(anything() as any)).thenResolve(null as any);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = {
				id: "300",
				members: {
					fetch: async () => createMemberCollection([]),
				},
			} as any;

			await handler.handle(guild);

			verify(userLogicMock.bulkCreate(anything())).never();
		});

		/**
		 * [User変換] members.fetchの全メンバーをUserDtoに変換
		 * - 全員がbulkCreate対象になる
		 */
		it("guild.members.fetch() の結果全員がUserDtoに変換される", async () => {
			const handler = new ActionAddBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(22);

			when(communityLogicMock.create(anything() as any)).thenResolve(communityId);

			let receivedUsers: UserDto[] = [];
			when(userLogicMock.bulkCreate(anything() as any)).thenCall((users: UserDto[]) => {
				receivedUsers = users;
				return Promise.resolve(true);
			});

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = {
				id: "555",
				members: {
					fetch: async () =>
						createMemberCollection([
							{ id: "10", user: { bot: false } },
							{ id: "11", user: { bot: true } },
						]),
				},
			} as any;

			await handler.handle(guild);

			expect(receivedUsers).to.have.length(2);
			expect(receivedUsers.map((u) => u.clientId.getValue())).to.deep.equal([BigInt("10"), BigInt("11")]);
		});

		/**
		 * [UserType] bot/userのUserTypeが正しく設定される
		 * - botはUserType.bot
		 * - 通常ユーザーはUserType.user
		 */
		it("botメンバーはUserType.bot、通常ユーザーはUserType.userになる", async () => {
			const handler = new ActionAddBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(23);

			when(communityLogicMock.create(anything() as any)).thenResolve(communityId);
			let receivedUsers: UserDto[] = [];
			when(userLogicMock.bulkCreate(anything() as any)).thenCall((users: UserDto[]) => {
				receivedUsers = users;
				return Promise.resolve(true);
			});

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = {
				id: "700",
				members: {
					fetch: async () =>
						createMemberCollection([
							{ id: "21", user: { bot: false } },
							{ id: "22", user: { bot: true } },
						]),
				},
			} as any;

			await handler.handle(guild);

			expect(receivedUsers[0]?.userType.getValue()).to.equal(UserType.user.getValue());
			expect(receivedUsers[1]?.userType.getValue()).to.equal(UserType.bot.getValue());
		});

		/**
		 * [User作成] UserLogic.bulkCreate → UserRepositoryImpl.bulkCreate
		 * - 複数レコードが作成される
		 * - batchStatus=Yetになる
		 */
		it("UserLogic.bulkCreate → UserRepositoryImpl.bulkCreateで複数レコードが作成される", async () => {
			const handler = new ActionAddBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(24);
			when(communityLogicMock.create(anything() as any)).thenResolve(communityId);
			when(userLogicMock.bulkCreate(anything() as any)).thenResolve(true);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = {
				id: "888",
				members: {
					fetch: async () =>
						createMemberCollection([
							{ id: "31", user: { bot: false } },
							{ id: "32", user: { bot: true } },
						]),
				},
			} as any;

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
	 * 2) ActionAddUserRouter / ActionAddUserHandler
	 */
	describe("2) ActionAddUserRouter / ActionAddUserHandler", () => {
		/**
		 * [Router呼び出し] guildMemberAddでHandlerが呼び出される
		 */
		it("guildMemberAddでRouterがHandlerを呼び出す", async () => {
			const router = new ActionAddUserRouter();
			const loggerMock = createLoggerMock();
			const handlerMock = mock<ActionAddUserHandler>();
			(router as any).logger = instance(loggerMock);
			(router as any).handler = instance(handlerMock);

			const member = { id: "501", guild: { id: "500" } } as any;
			let registeredCallback: ((m: any) => Promise<void>) | null = null;
			const client = {
				on: (event: string, callback: (m: any) => Promise<void>) => {
					if (event === "guildMemberAdd") {
						registeredCallback = callback;
					}
				},
			} as any;

			router.register(client);
			if (!registeredCallback) {
				throw new Error("guildMemberAdd handler was not registered");
			}
			await (registeredCallback as (payload: any) => Promise<void>)(member);

			verify(handlerMock.handle(member)).once();
		});

		/**
		 * [Bot自身] Botの加入イベントはスキップされる
		 */
		it("Bot自身の加入イベントは処理がスキップされる", async () => {
			const handler = new ActionAddUserHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const member = {
				id: AppConfig.discord.clientId,
				guild: { id: "777" },
			} as any;

			await handler.handle(member);

			verify(communityLogicMock.getId(anything())).never();
			verify(userLogicMock.bulkCreate(anything())).never();
		});

		/**
		 * [Community未登録] Communityが存在しない場合は処理停止
		 */
		it("CommunityLogic.getIdが呼ばれ、未登録Communityでは処理停止する", async () => {
			const handler = new ActionAddUserHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const member = {
				id: "900",
				guild: { id: "901" },
			} as any;

			await handler.handle(member);

			verify(communityLogicMock.getId(anything())).once();
			verify(userLogicMock.bulkCreate(anything())).never();
		});

		/**
		 * [User作成] 1件のみでbulkCreateされる
		 */
		it("UserLogic.bulkCreateが1件のみで実行される", async () => {
			const handler = new ActionAddUserHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(99);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			let receivedUsers: UserDto[] = [];
			when(userLogicMock.bulkCreate(anything() as any)).thenCall((users: UserDto[]) => {
				receivedUsers = users;
				return Promise.resolve(true);
			});

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const member = {
				id: "888",
				guild: { id: "777" },
			} as any;

			await handler.handle(member);

			expect(receivedUsers).to.have.length(1);
			verify(userLogicMock.bulkCreate(anything())).once();
		});

		/**
		 * [UserDto内容] categoryType/clientId/communityIdが正しい
		 */
		it("UserDtoのcategoryType/clientId/communityIdが正しい", async () => {
			const handler = new ActionAddUserHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(77);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			let receivedUsers: UserDto[] = [];
			when(userLogicMock.bulkCreate(anything() as any)).thenCall((users: UserDto[]) => {
				receivedUsers = users;
				return Promise.resolve(true);
			});

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

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

		/**
		 * [失敗時] bulkCreate=falseなら後続処理をしない
		 */
		it("失敗時（bulkCreate=false）に後続処理は行われない", async () => {
			const handler = new ActionAddUserHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(55);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			when(userLogicMock.bulkCreate(anything() as any)).thenResolve(false);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const member = {
				id: "3001",
				guild: { id: "3002" },
			} as any;

			await handler.handle(member);

			verify(userLogicMock.bulkCreate(anything())).once();
		});
	});

	/**
	 * 3) ActionRemoveBotRouter / ActionRemoveBotHandler
	 */
	describe("3) ActionRemoveBotRouter / ActionRemoveBotHandler", () => {
		/**
		 * [Router呼び出し] guildDeleteでHandlerが呼び出される
		 */
		it("guildDeleteでRouterがHandlerを呼び出す", async () => {
			const router = new ActionRemoveBotRouter();
			const loggerMock = createLoggerMock();
			const handlerMock = mock<ActionRemoveBotHandler>();

			(router as any).logger = instance(loggerMock);
			(router as any).handler = instance(handlerMock);

			const guild = { id: "600" } as any;
			let registeredCallback: ((g: any) => Promise<void>) | null = null;
			const client = {
				on: (event: string, callback: (g: any) => Promise<void>) => {
					if (event === "guildDelete") {
						registeredCallback = callback;
					}
				},
			} as any;

			router.register(client);
			if (!registeredCallback) {
				throw new Error("guildDelete handler was not registered");
			}
			await (registeredCallback as (payload: any) => Promise<void>)(guild);

			verify(handlerMock.handle(guild)).once();
		});

		/**
		 * [Community未登録] getIdで取得できない場合は停止
		 */
		it("CommunityLogic.getIdでCommunityIdが取得できない場合は処理を終了する", async () => {
			const handler = new ActionRemoveBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = { id: "800" } as any;
			await handler.handle(guild);

			verify(communityLogicMock.delete(anything())).never();
			verify(userLogicMock.deletebyCommunityId(anything())).never();
		});

		/**
		 * [削除順序] Community削除→User削除の順
		 */
		it("CommunityLogic.deleteが先に実行される", async () => {
			const handler = new ActionRemoveBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
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

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = { id: "600" } as any;
			await handler.handle(guild);

			expect(callOrder).to.deep.equal(["communityDelete", "userDelete"]);
		});

		/**
		 * [失敗時] Community削除失敗でUser削除しない
		 */
		it("Community削除に失敗した場合、User削除が実行されない", async () => {
			const handler = new ActionRemoveBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(66);

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			when(communityLogicMock.delete(anything() as any)).thenResolve(false);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = { id: "901" } as any;
			await handler.handle(guild);

			verify(userLogicMock.deletebyCommunityId(anything())).never();
		});

		/**
		 * [User削除] UserLogic.deletebyCommunityIdが呼ばれる
		 * - Repository.deletebyCommunityIdの条件も検証
		 */
		it("UserLogic.deletebyCommunityId → UserRepositoryImpl.deletebyCommunityIdが呼ばれる", async () => {
			const handler = new ActionRemoveBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(77);
			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(communityId);
			when(communityLogicMock.delete(anything() as any)).thenResolve(true);
			when(userLogicMock.deletebyCommunityId(anything() as any)).thenResolve(true);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = { id: "999" } as any;
			await handler.handle(guild);

			verify(userLogicMock.deletebyCommunityId(anything())).once();

			const originalDestroy = UserRepositoryImpl.destroy;
			let receivedWhere: any = null;
			(UserRepositoryImpl as any).destroy = (options: any) => {
				receivedWhere = options.where;
				return Promise.resolve(1);
			};

			await UserRepositoryImpl.prototype.deletebyCommunityId.call({} as UserRepositoryImpl, new UserCommunityId(communityId.getValue()));
			expect(receivedWhere).to.deep.equal({
				communityId: communityId.getValue(),
			});

			(UserRepositoryImpl as any).destroy = originalDestroy;
		});

		/**
		 * [削除順序] Community→User順で削除される
		 */
		it("削除順序が「Community→User」であることを確認する", async () => {
			const handler = new ActionRemoveBotHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();
			const communityId = new CommunityId(45);
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

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const guild = { id: "333" } as any;
			await handler.handle(guild);

			expect(callOrder).to.deep.equal(["communityDelete", "userDelete"]);
		});
	});

	/**
	 * 4) ActionRemoveUserRouter / ActionRemoveUserHandler
	 */
	describe("4) ActionRemoveUserRouter / ActionRemoveUserHandler", () => {
		/**
		 * [Router呼び出し] guildMemberRemoveでHandlerが呼び出される
		 */
		it("guildMemberRemoveでRouterがHandlerを呼び出す", async () => {
			const router = new ActionRemoveUserRouter();
			const loggerMock = createLoggerMock();
			const handlerMock = mock<ActionRemoveUserHandler>();

			(router as any).logger = instance(loggerMock);
			(router as any).handler = instance(handlerMock);

			const member = { id: "701", guild: { id: "700" } } as any;
			let registeredCallback: ((m: any) => Promise<void>) | null = null;
			const client = {
				on: (event: string, callback: (m: any) => Promise<void>) => {
					if (event === "guildMemberRemove") {
						registeredCallback = callback;
					}
				},
			} as any;

			router.register(client);
			if (!registeredCallback) {
				throw new Error("guildMemberRemove handler was not registered");
			}
			await (registeredCallback as (payload: any) => Promise<void>)(member);

			verify(handlerMock.handle(member)).once();
		});

		/**
		 * [Bot自身] Botの離脱イベントはスキップ
		 */
		it("Bot自身の離脱イベントは処理がスキップされる", async () => {
			const handler = new ActionRemoveUserHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const member = {
				id: AppConfig.discord.clientId,
				guild: { id: "111" },
			} as any;

			await handler.handle(member);

			verify(communityLogicMock.getId(anything())).never();
			verify(userLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).never();
		});

		/**
		 * [Community未登録] getId取得不可なら削除しない
		 */
		it("CommunityLogic.getIdが取得できない場合は削除しない", async () => {
			const handler = new ActionRemoveUserHandler();
			const loggerMock = createLoggerMock();
			const communityLogicMock = mock<ICommunityLogic>();
			const userLogicMock = mock<IUserLogic>();

			(when(communityLogicMock.getId(anything()) as any) as any).thenResolve(undefined);

			(handler as any).logger = instance(loggerMock);
			(handler as any).CommunityLogic = instance(communityLogicMock);
			(handler as any).UserLogic = instance(userLogicMock);

			const member = { id: "123", guild: { id: "456" } } as any;
			await handler.handle(member);

			verify(userLogicMock.deleteByCommunityIdAndClientId(anything(), anything())).never();
		});

		/**
		 * [User削除] communityId/clientIdで削除される
		 */
		it("UserLogic.deleteByCommunityIdAndClientId → UserRepositoryImpl.deleteByCommunityIdAndClientIdが呼ばれる", async () => {
			const handler = new ActionRemoveUserHandler();
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

		/**
		 * [Repository条件] communityId / clientId 条件で1件削除
		 */
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
	 * 共通（Logic/Repository観点）
	 */
	describe("共通（Logic/Repository観点）", () => {
		/**
		 * [条件一致] Community create/delete/getIdの条件が一致
		 */
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

		/**
		 * [batchStatus] User bulkCreateでYetが設定される
		 */
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

		/**
		 * [削除条件] communityId/clientId条件が適用される
		 */
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

		/**
		 * [例外ログ] Router/Handlerの例外でログ出力
		 */
		it("Router/Handlerで例外が発生した場合にログに出力される", async () => {
			const router = new ActionAddBotRouter();
			const routerLogger = createLoggerMock();
			const handlerMock = mock<ActionAddBotHandler>();
			when(handlerMock.handle(anything())).thenThrow(new Error("boom"));

			(router as any).logger = instance(routerLogger);
			(router as any).handler = instance(handlerMock);

			const guild = { id: "100" } as any;
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

			const handler = new ActionAddUserHandler();
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

			verify(handlerLogger.error("ActionAddUserHandler error: Error: handler error")).once();
		});

		/**
		 * [条件一致] getId/deleteでcategoryType/clientIdが一致
		 */
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

		/**
		 * [削除条件] deleteByCommunityIdAndClientIdの条件が適用される
		 */
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

		/**
		 * [NOT IN条件] deleteNotBelongByCommunityIdAndClientIdsの条件が適用
		 */
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
});
