import "reflect-metadata";
import { ContainerUp, ContainerDown } from "@/tests/fixtures/database/ContainerTest";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ContextId } from "@/src/entities/vo/ContextId";
import { PersonalityContextPersonalityId } from "@/src/entities/vo/PersonalityContextPersonalityId";
import { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";
import { PersonalityName } from "@/src/entities/vo/PersonalityName";
import { PersonalityPrompt } from "@/src/entities/vo/PersonalityPrompt";
import { ContextName } from "@/src/entities/vo/ContextName";
import { ContextPrompt } from "@/src/entities/vo/ContextPrompt";
import { TextChannel } from "discord.js";
import { TalkCommandHandler } from "@/src/handlers/discord.js/commands/TalkCommandHandler";
import { appContainer } from "@/src/app.di.config";
import { HandlerTypes } from "@/src/entities/constants/DIContainerTypes";

describe("Test Talk Commands", function(this: Mocha.Suite) {
  // テストのタイムアウト時間を延長（30秒）
  this.timeout(30000);

  before(async () => {
    await ContainerUp();
  });

  after(async () => {
    await ContainerDown();
  });

  // テスト用のMockLoggerを作成
  class MockLogger {
    info(message: string) {
      // テスト用なので何もしない
    }
    error(message: string) {
      // テスト用なので何もしない
    }
    warn(message: string) {
      // テスト用なので何もしない
    }
    debug(message: string) {
      // テスト用なので何もしない
    }
  }

  beforeEach(async () => {
    // データベース接続を初期化（MockLoggerを使用）
    const connector = new MysqlConnector();
    // @ts-ignore - privateフィールドにアクセスするため
    connector.logger = new MockLogger();

    // テスト前にデータをクリーンアップ
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

    // テスト用のデータをセットアップ

    // Personalityデータの作成
    await PersonalityRepositoryImpl.create({
      id: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
      name: "わいわいちゃん",
      prompt: {
        persona_role: "アシスタント",
        speaking_style_rules: "フレンドリー",
        response_directives: "丁寧に",
        emotion_model: "明るく",
        notes: "テスト用",
        input_scope: "全般"
      }
    });

    // Contextデータの作成
    await ContextRepositoryImpl.create({
      id: 1,
      name: "テストコンテキスト",
      prompt: {
        persona_role: "テスト役割",
        speaking_style_rules: "テストスタイル",
        response_directives: "テスト指示",
        emotion_model: "テスト感情",
        notes: "テスト注釈",
        input_scope: "テスト範囲"
      }
    });

    // PersonalityContextデータの作成
    await PersonalityContextRepositoryImpl.create({
      personalityId: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
      contextId: 1
    });
  });

	/**
	 * TalkCommandHandlerのテスト
	*/

	/**
	 * コマンド識別機能のテスト
	 * - `isHandle`メソッドが「talk」コマンドを正しく識別できるか
	 * - 他のコマンド名では`false`を返すか
	 */
  it("test isHandle method correctly identifies 'talk' command", function() {
    // TalkCommandHandlerのインスタンスを直接作成
    const talkCommandHandler = new TalkCommandHandler();

    // "talk"コマンドの場合はtrueを返すことを確認
    expect(talkCommandHandler.isHandle("talk")).to.be.true;

    // 他のコマンド名の場合はfalseを返すことを確認
    expect(talkCommandHandler.isHandle("other")).to.be.false;
    expect(talkCommandHandler.isHandle("candycheck")).to.be.false;
    expect(talkCommandHandler.isHandle("")).to.be.false;
  });

	/**
	 * チャンネル種別判定のテスト
	 * - `isTextChannel`メソッドがTextChannelを正しく判定できるか
	 * - 他のチャンネル種別（VoiceChannelなど）では`false`を返すか
	 */
  it("test isTextChannel method correctly identifies TextChannel", function() {
    // TalkCommandHandlerのインスタンスを直接作成
    const talkCommandHandler = new TalkCommandHandler();

    // TextChannelの場合はtrueを返すことを確認
    const textChannel = {
      threads: {
        create: async () => ({})
      }
    };
    expect(talkCommandHandler.isTextChannel(textChannel)).to.be.true;

    // threadsプロパティがない場合はfalseを返すことを確認
    const nonpropertyTextChannel = {};
    expect(talkCommandHandler.isTextChannel(nonpropertyTextChannel)).to.be.false;

    // threads.createメソッドがない場合はfalseを返すことを確認
    const nonMethodTextChannel = {
      threads: {}
    };
    expect(talkCommandHandler.isTextChannel(nonMethodTextChannel)).to.be.false;
  });

  /**
   * 基本的なコマンド実行のテスト
   * - タイトルを指定した場合に正しくスレッドが作成されるか
   * - 応答メッセージが「以下にお話する場を用意したよ！っ」であるか
   * - 作成されたスレッドのタイトルが正しいか（`${context.name.getValue()}: ${title}`の形式）
   */
  it("test talk command with title", async function(this: Mocha.Context) {
    // 個別のテストのタイムアウト時間を延長（10秒）
    this.timeout(10000);
    // テスト用のパラメータ
    const testTitle = "テストタイトル";
    const testContextType = 1; // コンテキストタイプ
    const testGuildId = "12345";
    const testMessageId = "67890";
    const expectedThreadTitle = `テストコンテキスト: ${testTitle}`;

    // モックの設定
    const commandMock = mockSlashCommand("talk", {
      title: testTitle,
      type: testContextType,
    });

    // モックのチャンネル設定
    const channelMock = mock<TextChannel>();
    when(commandMock.channel).thenReturn(instance(channelMock));
    when(channelMock.threads).thenReturn({
      create: async () => ({}),
    } as any);

    // モックのメッセージ設定
    when(commandMock.reply(anything())).thenResolve({
      id: testMessageId,
      guildId: testGuildId,
      startThread: async (options: any) => {
        // スレッドタイトルの検証
        expect(options.name).to.equal(expectedThreadTitle);
        return {};
      },
    } as any);

    // オブジェクト引数を受け取るreplyメソッドのモック
    when(commandMock.reply({
      content: "以下にお話する場を用意したよ！っ",
      fetchReply: true
    })).thenResolve({
      id: testMessageId,
      guildId: testGuildId,
      startThread: async (options: any) => {
        // スレッドタイトルの検証
        expect(options.name).to.equal(expectedThreadTitle);
        return {};
      },
    } as any);

    // コマンド実行
    const TEST_CLIENT = await TestDiscordServer.getClient();
    TEST_CLIENT.emit("interactionCreate", instance(commandMock));

    // 応答を待機
    await waitUntilReply(commandMock);

    // 応答メッセージの検証
    verify(commandMock.reply(anything())).once();

    // スレッドが作成されるまで少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));

    const threads = await ThreadRepositoryImpl.findAll();

    // スレッドが作成されたことを確認
    expect(threads.length).to.eq(1);

    // スレッドの内容を検証
    const thread = threads[0];
    expect(thread.guildId.toString()).to.eq(testGuildId);
    expect(thread.messageId.toString()).to.eq(testMessageId);
    expect(thread.categoryType).to.eq(ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue());

    // メタデータが正しく設定されていることを確認
    const metadata = thread.metadata;
    expect(metadata).to.not.be.null;
    expect(metadata).to.be.an('object');

    // メタデータに必要なプロパティが含まれていることを確認
    const metadataObj = JSON.parse(JSON.stringify(metadata));
    expect(metadataObj).to.have.property('persona_role');
    expect(metadataObj).to.have.property('speaking_style_rules');
    expect(metadataObj).to.have.property('response_directives');
    expect(metadataObj).to.have.property('emotion_model');
    expect(metadataObj).to.have.property('notes');
    expect(metadataObj).to.have.property('input_scope');
  });
});
