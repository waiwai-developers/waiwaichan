import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { TalkCommandHandler } from "@/src/handlers/discord.js/commands/TalkCommandHandler";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import { anything, instance, verify, when } from "ts-mockito";
import {
	TEST_GUILD_ID,
	assertThreadCount,
	assertThreadExistsWithData,
	createTextChannelMock,
	emitInteractionEvent,
} from "./TalkTestHelpers";

describe("Talk Command Basic Tests", function (this: Mocha.Suite) {
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
	 * コマンド識別機能のテスト
	 */
	it("test isHandle method correctly identifies 'talk' command", () => {
		const talkCommandHandler = new TalkCommandHandler();

		expect(talkCommandHandler.isHandle("talk")).to.be.true;
		expect(talkCommandHandler.isHandle("other")).to.be.false;
		expect(talkCommandHandler.isHandle("candycheck")).to.be.false;
		expect(talkCommandHandler.isHandle("")).to.be.false;
	});

	/**
	 * チャンネル種別判定のテスト
	 */
	it("test isTextChannel method correctly identifies TextChannel", () => {
		const talkCommandHandler = new TalkCommandHandler();

		const textChannel = {
			threads: {
				create: async () => ({}),
			},
		};
		expect(talkCommandHandler.isTextChannel(textChannel)).to.be.true;

		const nonpropertyTextChannel = {};
		expect(talkCommandHandler.isTextChannel(nonpropertyTextChannel)).to.be.false;

		const nonMethodTextChannel = {
			threads: {},
		};
		expect(talkCommandHandler.isTextChannel(nonMethodTextChannel)).to.be.false;
	});

	/**
	 * 基本的なコマンド実行のテスト
	 */
	it("test talk command with title", async function (this: Mocha.Context) {
		this.timeout(50_000);

		const testTitle = "テストタイトル";
		const testContextType = 999;
		const testMessageId = "67890";
		const expectedThreadTitle = `テストコンテキスト: ${testTitle}`;

		const commandMock = mockSlashCommand(
			"talk",
			{
				title: testTitle,
				type: testContextType,
			},
			{ guildId: TEST_GUILD_ID },
		);

		const channelMock = createTextChannelMock();
		when(commandMock.channel).thenReturn(instance(channelMock));

		when(commandMock.reply(anything())).thenResolve({
			id: testMessageId,
			communityId: 1,
			startThread: async (options: any) => {
				expect(options.name).to.equal(expectedThreadTitle);
				return {};
			},
		} as any);

		when(
			commandMock.reply({
				content: "以下にお話する場を用意したよ！っ",
				fetchReply: true,
			}),
		).thenResolve({
			id: testMessageId,
			communityId: 1,
			startThread: async (options: any) => {
				expect(options.name).to.equal(expectedThreadTitle);
				return {};
			},
		} as any);

		await emitInteractionEvent(commandMock);
		await waitUntilReply(commandMock);

		verify(commandMock.reply(anything())).once();

		await new Promise((resolve) => setTimeout(resolve, 5000));

		await assertThreadCount(1);
		await assertThreadExistsWithData(testMessageId, {
			communityId: "1",
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {},
		});
	});
});
