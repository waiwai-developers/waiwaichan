import "reflect-metadata";
import { ITEM_RECORDS } from "@/migrator/seeds/20241111041901-item";
import { ID_JACKPOT } from "@/src/entities/constants/Items";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import {
	CandyNotificationChannelRepositoryImpl,
	CandyRepositoryImpl,
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
	MessageRepositoryImpl,
	UserCandyItemRepositoryImpl,
	UserRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockReaction } from "@/tests/fixtures/discord.js/MockReaction";
import { waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import dayjs from "dayjs";
import type { ChatInputCommandInteraction, MessageReactionEventDetails } from "discord.js";
import { anything, instance, mock, when } from "ts-mockito";

// テスト用の定数
export const TEST_GUILD_ID = "1234567890" as const;
export const TEST_CHANNEL_ID = "1234567890" as const; // Match MockReaction's default channelId
export const TEST_USER_ID = "1234" as const;
export const TEST_GIVE_USER_ID = "12345" as const;
export const TEST_RECEIVER_ID = "5678" as const;

// ドロー結果メッセージ定数
export const JACKPOT_RESULT_MESSAGE = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
export const HIT_ITEM_NAME = ITEM_RECORDS[1].name;

// ============================================================
// モック生成ヘルパー関数
// ============================================================

export interface CandyDataOptions {
	userId: number;
	giveUserId: number;
	communityId: number;
	messageId?: string;
	expiredAt?: string;
	deletedAt?: string | null;
	categoryType?: number;
	createdAt?: string;
	updatedAt?: string;
}

export function createCandyData(options: CandyDataOptions): {
	userId: number;
	giveUserId: number;
	messageId: string;
	expiredAt: string;
	deletedAt: string | null;
	communityId: number;
	categoryType: number;
	createdAt?: string;
	updatedAt?: string;
} {
	const data: ReturnType<typeof createCandyData> = {
		userId: options.userId,
		giveUserId: options.giveUserId,
		messageId: options.messageId ?? "5678",
		expiredAt: options.expiredAt ?? "2999/12/31 23:59:59",
		deletedAt: options.deletedAt ?? null,
		communityId: options.communityId,
		categoryType: options.categoryType ?? CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
	};

	if (options.createdAt) data.createdAt = options.createdAt;
	if (options.updatedAt) data.updatedAt = options.updatedAt;

	return data;
}

export function createBulkCandyData(
	amount: number,
	options: Pick<CandyDataOptions, "userId" | "giveUserId" | "communityId" | "categoryType">,
): ReturnType<typeof createCandyData>[] {
	return Array.from({ length: amount }, () =>
		createCandyData({
			...options,
			messageId: "5678",
			deletedAt: null,
		}),
	);
}

export function createPityCandyData(
	totalAmount: number,
	usedCount: number,
	options: Pick<CandyDataOptions, "userId" | "giveUserId" | "communityId" | "categoryType">,
): ReturnType<typeof createCandyData>[] {
	const insertData: ReturnType<typeof createCandyData>[] = [];

	for (let i = 0; i < totalAmount; i++) {
		const date = new Date();
		date.setDate(date.getDate() - (totalAmount - i));
		insertData.push(
			createCandyData({
				...options,
				messageId: String(10_000 + i),
				deletedAt: i < usedCount ? date.toISOString() : null,
				createdAt: date.toISOString(),
				updatedAt: date.toISOString(),
			}),
		);
	}

	return insertData;
}

export interface UserCandyItemDataOptions {
	userId: number;
	communityId: number;
	itemId: number;
	candyId: number;
	expiredAt?: string;
	deletedAt?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
}

export function createUserCandyItemData(options: UserCandyItemDataOptions): {
	userId: number;
	itemId: number;
	candyId: number;
	expiredAt: string;
	communityId: number;
	deletedAt?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
} {
	const data: ReturnType<typeof createUserCandyItemData> = {
		userId: options.userId,
		itemId: options.itemId,
		candyId: options.candyId,
		expiredAt: options.expiredAt ?? "2999/12/31 23:59:59",
		communityId: options.communityId,
	};

	if (options.deletedAt !== undefined) data.deletedAt = options.deletedAt;
	if (options.createdAt) data.createdAt = options.createdAt;
	if (options.updatedAt) data.updatedAt = options.updatedAt;

	return data;
}

export function createThisYearJackpotData(
	options: Pick<UserCandyItemDataOptions, "userId" | "communityId" | "candyId">,
): ReturnType<typeof createUserCandyItemData> {
	const thisYearStart = dayjs().startOf("year").toDate();
	return createUserCandyItemData({
		...options,
		itemId: ID_JACKPOT,
		createdAt: thisYearStart,
		updatedAt: thisYearStart,
	});
}

export function createLastYearJackpotData(
	options: Pick<UserCandyItemDataOptions, "userId" | "communityId" | "candyId">,
): ReturnType<typeof createUserCandyItemData> {
	const lastYearEnd = dayjs().subtract(1, "year").endOf("year").toDate();
	return createUserCandyItemData({
		...options,
		itemId: ID_JACKPOT,
		createdAt: lastYearEnd,
		updatedAt: lastYearEnd,
	});
}

export function setupCommandMockReply(commandMock: ChatInputCommandInteraction): {
	getValue: () => string;
	getValues: () => string[];
} {
	let value = "";
	const values: string[] = [];

	when(commandMock.reply(anything())).thenCall((args) => {
		value = args;
		values.push(args);
		console.log("Reply received:", args);
	});

	when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

	return {
		getValue: () => value,
		getValues: () => values,
	};
}

// ============================================================
// イベント登録テストヘルパー関数
// ============================================================

export async function emitSlashCommand(commandMock: ChatInputCommandInteraction, timeout?: number, expectedCalls?: number): Promise<void> {
	const TEST_CLIENT = await TestDiscordServer.getClient();
	TEST_CLIENT.emit("interactionCreate", instance(commandMock));
	await waitSlashUntilReply(commandMock, timeout, expectedCalls);
}

export interface ReactionMessageOptions {
	messageId?: string;
	guildId?: string;
	url?: string;
	authorId?: string;
	authorBot?: boolean;
}

export function setupReactionMessageMock(messageMock: ReturnType<typeof mockReaction>["messageMock"], options: ReactionMessageOptions = {}): void {
	const {
		messageId = "5678",
		guildId = TEST_GUILD_ID,
		url = `https://discord.com/channels/${guildId}/${guildId}/${messageId}`,
		authorId,
		authorBot,
	} = options;

	when(messageMock.id).thenReturn(messageId);
	when(messageMock.guildId).thenReturn(guildId);
	when(messageMock.url).thenReturn(url);

	if (authorId !== undefined) {
		when(messageMock.author).thenReturn({
			id: authorId,
			bot: authorBot ?? false,
		} as any);
	}
}

export async function emitReactionEvent(
	reaction: ReturnType<typeof mockReaction>["reaction"],
	user: ReturnType<typeof mockReaction>["user"],
	waitTime = 100,
): Promise<void> {
	const TEST_CLIENT = await TestDiscordServer.getClient();
	TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));
	await new Promise((resolve) => setTimeout(resolve, waitTime));
}

export async function setupAndEmitCandyReaction(
	emoji: string,
	giverId: string,
	receiverId: string,
	messageOptions: ReactionMessageOptions = {},
): Promise<{
	reaction: ReturnType<typeof mockReaction>["reaction"];
	user: ReturnType<typeof mockReaction>["user"];
	messageMock: ReturnType<typeof mockReaction>["messageMock"];
}> {
	const { reaction, user, messageMock } = mockReaction(emoji, giverId, receiverId);
	setupReactionMessageMock(messageMock, messageOptions);
	await emitReactionEvent(reaction, user);
	return { reaction, user, messageMock };
}

// ============================================================
// Handler初期化ヘルパー関数
// ============================================================

export interface TestContext {
	communityId: number;
	userId: number;
	giveUserId: number;
	receiverUserId: number;
	channelId: number;
}

export function initializeDatabase(): void {
	new MysqlConnector();
}

export async function cleanupAllTables(): Promise<void> {
	await CandyNotificationChannelRepositoryImpl.destroy({ truncate: true, force: true });
	await CandyRepositoryImpl.destroy({ truncate: true, force: true });
	await UserCandyItemRepositoryImpl.destroy({ truncate: true, force: true });
	await MessageRepositoryImpl.destroy({ truncate: true, force: true });
	await UserRepositoryImpl.destroy({ truncate: true, force: true });
	await ChannelRepositoryImpl.destroy({ truncate: true, force: true });
	await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
}

export async function cleanupCandyTables(): Promise<void> {
	await CandyRepositoryImpl.destroy({ truncate: true, force: true });
	await UserCandyItemRepositoryImpl.destroy({ truncate: true, force: true });
	await MessageRepositoryImpl.destroy({ truncate: true, force: true });
}

export async function createCommunityAndUser(): Promise<TestContext> {
	const community = await CommunityRepositoryImpl.create({
		categoryType: 0,
		clientId: BigInt(TEST_GUILD_ID),
		batchStatus: 0,
	});

	const channel = await ChannelRepositoryImpl.create({
		categoryType: 0,
		clientId: BigInt(TEST_CHANNEL_ID),
		channelType: 0,
		communityId: community.id,
		batchStatus: 0,
	});

	const user = await UserRepositoryImpl.create({
		categoryType: 0,
		clientId: BigInt(TEST_USER_ID),
		userType: 0,
		communityId: community.id,
		batchStatus: 0,
	});

	const giveUser = await UserRepositoryImpl.create({
		categoryType: 0,
		clientId: BigInt(TEST_GIVE_USER_ID),
		userType: 0,
		communityId: community.id,
		batchStatus: 0,
	});

	const receiverUser = await UserRepositoryImpl.create({
		categoryType: 0,
		clientId: BigInt(TEST_RECEIVER_ID),
		userType: 0,
		communityId: community.id,
		batchStatus: 0,
	});

	return {
		communityId: community.id,
		userId: user.id,
		giveUserId: giveUser.id,
		receiverUserId: receiverUser.id,
		channelId: channel.id,
	};
}

export async function setupTestEnvironment(): Promise<TestContext> {
	initializeDatabase();
	await cleanupAllTables();
	return await createCommunityAndUser();
}

export async function teardownTestEnvironment(): Promise<void> {
	await cleanupAllTables();
}

// ============================================================
// Repositoryテストヘルパー関数
// ============================================================

export async function insertCandy(options: CandyDataOptions): Promise<void> {
	// First create a Message record since messageId is now a foreign key
	const message = await MessageRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(options.messageId ?? "5678"),
		communityId: options.communityId,
		userId: options.userId,
		channelId: 1, // Default channel
		batchStatus: 0,
	});
	
	const data = createCandyData(options);
	// Use the Message's internal ID instead of the client ID
	await CandyRepositoryImpl.create({
		...data,
		messageId: message.id,
	});
}

export async function insertBulkCandies(
	amount: number,
	options: Pick<CandyDataOptions, "userId" | "giveUserId" | "communityId" | "categoryType">,
): Promise<void> {
	// Create Message records first
	const messages = await Promise.all(
		Array.from({ length: amount }, async (_, i) => {
			return await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(`5678${i}`),
				communityId: options.communityId,
				userId: options.userId,
				channelId: 1, // Default channel
				batchStatus: 0,
			});
		})
	);

	const data = createBulkCandyData(amount, options);
	// Update messageIds to use Message internal IDs
	const candyData = data.map((candy, index) => ({
		...candy,
		messageId: messages[index].id,
	}));
	await CandyRepositoryImpl.bulkCreate(candyData);
}

export async function insertPityCandies(
	totalAmount: number,
	usedCount: number,
	options: Pick<CandyDataOptions, "userId" | "giveUserId" | "communityId" | "categoryType">,
): Promise<void> {
	// Create Message records first
	const messages = await Promise.all(
		Array.from({ length: totalAmount }, async (_, i) => {
			const date = new Date();
			date.setDate(date.getDate() - (totalAmount - i));
			return await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(10_000 + i),
				communityId: options.communityId,
				userId: options.userId,
				channelId: 1, // Default channel
				batchStatus: 0,
				createdAt: date,
				updatedAt: date,
			});
		})
	);

	const data = createPityCandyData(totalAmount, usedCount, options);
	// Update messageIds to use Message internal IDs
	const candyData = data.map((candy, index) => ({
		...candy,
		messageId: messages[index].id,
	}));
	await CandyRepositoryImpl.bulkCreate(candyData);
}

export async function insertThisYearJackpot(options: Pick<UserCandyItemDataOptions, "userId" | "communityId" | "candyId">): Promise<void> {
	const data = createThisYearJackpotData(options);
	await UserCandyItemRepositoryImpl.create(data);
}

export async function insertLastYearJackpot(options: Pick<UserCandyItemDataOptions, "userId" | "communityId" | "candyId">): Promise<void> {
	const data = createLastYearJackpotData(options);
	await UserCandyItemRepositoryImpl.create(data);
}

export async function insertBothYearsJackpots(options: Pick<UserCandyItemDataOptions, "userId" | "communityId">): Promise<void> {
	await insertLastYearJackpot({ ...options, candyId: 1 });
	await insertThisYearJackpot({ ...options, candyId: 2 });
}

export async function verifyCandyCount(expectedCount: number): Promise<void> {
	const count = await CandyRepositoryImpl.count();
	expect(count).to.eq(expectedCount);
}

export async function verifyCandyCountUnchanged(beforeCount: number): Promise<void> {
	const afterCount = await CandyRepositoryImpl.count();
	expect(afterCount).to.eq(beforeCount);
}

export async function getAllCandies() {
	return await CandyRepositoryImpl.findAll();
}

export async function getCandyCount(): Promise<number> {
	return await CandyRepositoryImpl.count();
}
