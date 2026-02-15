import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { mockSlashCommand } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { TEST_GUILD_ID, assertNoThreadsCreated, createTextChannelMock, emitInteractionEvent } from "./TalkTestHelpers";

describe("Talk Command Error Handling Tests", function (this: Mocha.Suite) {
	this.timeout(60_000);

	beforeEach(async () => {
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		await CommunityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});

		await CommunityRepositoryImpl.create({
			categoryType: CommunityCategoryType.Discord.getValue(),
			clientId: BigInt(TEST_GUILD_ID),
			batchStatus: 0,
		});

		await ThreadRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await PersonalityContextRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await ContextRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await PersonalityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});

		await PersonalityRepositoryImpl.create({
			id: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
			name: "わいわいちゃん",
			prompt: {
				persona_role: "アシスタント",
				speaking_style_rules: "フレンドリー",
				response_directives: "丁寧に",
				emotion_model: "明るく",
				notes: "テスト用",
				input_scope: "全般",
			},
		});

		await ContextRepositoryImpl.create({
			id: 999,
			name: "テストコンテキスト",
			prompt: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		await PersonalityContextRepositoryImpl.create({
			personalityId: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
			contextId: 999,
		});
	});

	/**
	 * タイトルがnullの場合のエラーハンドリング
	 */
	it("test talk command with null title should throw error", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const commandMock = mockSlashCommand(
			"talk",
			{ title: null, type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue() },
			{ guildId: TEST_GUILD_ID },
		);

		const channelMock = createTextChannelMock();
		when(commandMock.channel).thenReturn(instance(channelMock));

		await emitInteractionEvent(commandMock);

		await new Promise((resolve) => setTimeout(resolve, 100));

		await assertNoThreadsCreated();
	});

	/**
	 * 無効なtype値の場合のエラーハンドリング
	 */
	it("test talk command with invalid type should return error", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const commandMock = mockSlashCommand("talk", { title: "テストタイトル", type: 99999 }, { guildId: TEST_GUILD_ID });

		const channelMock = createTextChannelMock();
		when(commandMock.channel).thenReturn(instance(channelMock));

		await emitInteractionEvent(commandMock);

		await new Promise((resolve) => setTimeout(resolve, 100));

		await assertNoThreadsCreated();
	});

	/**
	 * チャンネルがnullの場合のエラーハンドリング
	 */
	it("test talk command with null channel should skip processing safely", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const commandMock = mockSlashCommand(
			"talk",
			{
				title: "テストタイトル",
				type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			},
			{ guildId: TEST_GUILD_ID },
		);
		when(commandMock.channel).thenReturn(null);

		await emitInteractionEvent(commandMock);

		await new Promise((resolve) => setTimeout(resolve, 100));

		await assertNoThreadsCreated();
		verify(commandMock.reply(anything())).never();
	});

	/**
	 * 非テキストチャンネルの場合のエラーハンドリング
	 */
	it("test talk command with non-text channel should skip processing safely", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const commandMock = mockSlashCommand(
			"talk",
			{
				title: "テストタイトル",
				type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			},
			{ guildId: TEST_GUILD_ID },
		);

		const nonTextChannelMock = mock<any>();
		when(nonTextChannelMock.threads).thenReturn({});
		when(commandMock.channel).thenReturn(instance(nonTextChannelMock));

		await emitInteractionEvent(commandMock);

		await new Promise((resolve) => setTimeout(resolve, 100));

		await assertNoThreadsCreated();
		verify(commandMock.reply(anything())).never();
	});
});
