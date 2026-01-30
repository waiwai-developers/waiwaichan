import { CrownDto } from "@/src/entities/dto/CrownDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { CrownMessage } from "@/src/entities/vo/CrownMessage";
import { CrownMessageLink } from "@/src/entities/vo/CrownMessageLink";
import { MessageId } from "@/src/entities/vo/MessageId";
import {
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
	CrownRepositoryImpl,
	MessageRepositoryImpl,
	UserRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { expect } from "chai";

/**
 * テスト実行前の共通セットアップ
 * データベース接続を初期化する
 */
export function setupCrownTest(): void {
	new MysqlConnector();
}

/**
 * テスト実行後の共通クリーンアップ
 * 全てのテーブルをトランケートする
 */
export async function cleanupCrownTest(): Promise<void> {
	await CrownRepositoryImpl.destroy({
		truncate: true,
		force: true,
	});
	await MessageRepositoryImpl.destroy({
		truncate: true,
		force: true,
	});
	await ChannelRepositoryImpl.destroy({
		truncate: true,
		force: true,
	});
	await CommunityRepositoryImpl.destroy({
		truncate: true,
		force: true,
	});
	await UserRepositoryImpl.destroy({
		truncate: true,
		force: true,
	});
}

/**
 * ハンドラーの非同期処理完了を待機する
 * @param ms 待機時間（ミリ秒）デフォルト: 100ms
 */
export async function waitForHandlerCompletion(ms = 100): Promise<void> {
	await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * クラウンが作成されていないことを確認する共通アサーション
 */
export async function expectCrownNotCreated(): Promise<void> {
	const crowns = await CrownRepositoryImpl.findAll();
	expect(crowns.length).to.eq(0);
}

/**
 * クラウンが作成されていることを確認する共通アサーション
 * @param expectedCount 期待されるクラウンの数
 */
export async function expectCrownCreated(expectedCount = 1): Promise<void> {
	const crowns = await CrownRepositoryImpl.findAll();
	expect(crowns.length).to.eq(expectedCount);
}

/**
 * CrownDto のファクトリー関数
 * @param communityIdValue コミュニティID
 * @param messageIdValue メッセージID
 * @returns CrownDto インスタンス
 */
export function createCrownDto(communityIdValue: number, messageIdValue: number): CrownDto {
	return new CrownDto(new CommunityId(communityIdValue), new MessageId(messageIdValue));
}

/**
 * Crown テストデータのファクトリー関数
 * @param communityIdValue コミュニティID
 * @param messageIdValue メッセージID
 * @param messageContent メッセージ内容
 * @param messageLink メッセージリンク
 * @returns テストデータオブジェクト
 */
export interface CrownTestData {
	communityId: CommunityId;
	messageId: MessageId;
	crownMessage: CrownMessage;
	crownMessageLink: CrownMessageLink;
}

export function createCrownTestData(
	communityIdValue: number,
	messageIdValue: number,
	messageContent = "テストメッセージの内容",
	messageLink = "https://discord.com/channels/123/456/789",
): CrownTestData {
	return {
		communityId: new CommunityId(communityIdValue),
		messageId: new MessageId(messageIdValue),
		crownMessage: new CrownMessage(messageContent),
		crownMessageLink: new CrownMessageLink(messageLink),
	};
}

/**
 * 特定のコミュニティIDでクラウンを検索する
 * @param communityIdValue コミュニティID
 * @returns クラウンの配列
 */
export async function findCrownsByCommunityId(communityIdValue: number) {
	return await CrownRepositoryImpl.findAll({
		where: { communityId: communityIdValue },
	});
}

/**
 * 特定のコミュニティIDとメッセージIDでクラウンを検索する
 * @param communityIdValue コミュニティID
 * @param messageIdValue メッセージID
 * @returns クラウンの配列
 */
export async function findCrownByIds(communityIdValue: number, messageIdValue: number) {
	return await CrownRepositoryImpl.findAll({
		where: { communityId: communityIdValue, messageId: messageIdValue },
	});
}

/**
 * テスト用のクラウンレコードを直接作成する
 * @param communityIdValue コミュニティID
 * @param messageIdValue メッセージID
 */
export async function createCrownRecord(communityIdValue: number, messageIdValue: number): Promise<void> {
	await CrownRepositoryImpl.create({
		communityId: communityIdValue,
		messageId: messageIdValue,
	});
}
