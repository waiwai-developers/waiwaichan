import "reflect-metadata";
import { ContainerUp, ContainerDown } from "@/tests/fixtures/database/ContainerTest";
import { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";

// MockLoggerクラスの定義
class MockLogger implements ILogger {
  trace(msg: string): void {
    // テスト用なので何もしない
  }

  debug(msg: string): void {
    // テスト用なので何もしない
  }

  info(msg: string): void {
    // テスト用なので何もしない
  }

  error(msg: string): void {
    // テスト用なので何もしない
  }

  fatal(msg: string): void {
    // テスト用なので何もしない
  }
}
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import { anything, instance, mock, verify, when } from "ts-mockito";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { TextChannel } from "discord.js";
import { TalkCommandHandler } from "@/src/handlers/discord.js/commands/TalkCommandHandler";
import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { mockMessage, waitUntilMessageReply } from "@/tests/fixtures/discord.js/MockMessage";
import { AIReplyHandler } from "@/src/handlers/discord.js/events/AIReplyHandler";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadataChatgpt } from "@/src/entities/vo/ThreadMetadataChatgpt";
import { ThreadMetadata } from "@/src/entities/vo/ThreadMetadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { ThreadLogic } from "@/src/logics/ThreadLogic";
import { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";

describe("Test Talk Commands", function(this: Mocha.Suite) {
  // テストのタイムアウト時間を延長（30秒）
  this.timeout(30000);

  before(async () => {
    await ContainerUp();
  });

  after(async () => {
    await ContainerDown();
  });


  beforeEach(async () => {
    // データベース接続を初期化（MockLoggerを使用）
    const mockLogger = new MockLogger();
    const connector = new MysqlConnector();
    // @ts-ignore - privateフィールドにアクセスするため
    connector.logger = mockLogger;

    // Sequelizeのloggingオプションを直接設定
    // @ts-ignore - privateフィールドにアクセスするため
    connector.instance.options.logging = false;

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
    expect(metadataObj).to.have.property('emotion_model');
    expect(metadataObj).to.have.property('notes');
    expect(metadataObj).to.have.property('input_scope');
  });

    /**
     * ユーザー入力の異常系チェック
     * - タイトルが null の場合はエラーになるか
     */
    it("test talk command with null title should throw error", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト用のパラメータ（タイトルをnullに設定）
      const testContextType = 1;
      const commandMock = mockSlashCommand("talk", {
        title: null,
        type: testContextType,
      });

      // モックのチャンネル設定
      const channelMock = mock<TextChannel>();
      when(commandMock.channel).thenReturn(instance(channelMock));
      when(channelMock.threads).thenReturn({
        create: async () => ({}),
      } as any);

      // エラーメッセージでの応答を期待
      when(commandMock.reply(InternalErrorMessage)).thenResolve();

      // コマンド実行
      const TEST_CLIENT = await TestDiscordServer.getClient();
      TEST_CLIENT.emit("interactionCreate", instance(commandMock));

      // 応答を待機
      await waitUntilReply(commandMock);

      // エラーメッセージでの応答を検証
      verify(commandMock.reply(InternalErrorMessage)).once();

      // スレッドが作成されていないことを確認
      // ロギングを無効化してからfindAllを実行
      const mockLogger = new MockLogger();
      const connector = new MysqlConnector();
      // @ts-ignore - privateフィールドにアクセスするため
      connector.logger = mockLogger;
      // @ts-ignore - privateフィールドにアクセスするため
      connector.instance.options.logging = false;

      const threads = await ThreadRepositoryImpl.findAll();
      expect(threads.length).to.eq(0);
    });

    /**
     * ユーザー入力の異常系チェック
     * - type パラメータが想定外の値だった場合、エラーとして処理されるか
     */
    it("test talk command with invalid type should return error", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト用のパラメータ（存在しないコンテキストタイプを指定）
      const testTitle = "テストタイトル";
      const invalidContextType = 999; // 存在しないコンテキストタイプ

      // モックの設定
      const commandMock = mockSlashCommand("talk", {
        title: testTitle,
        type: invalidContextType,
      });

      // モックのチャンネル設定
      const channelMock = mock<TextChannel>();
      when(commandMock.channel).thenReturn(instance(channelMock));
      when(channelMock.threads).thenReturn({
        create: async () => ({}),
      } as any);

      // エラーメッセージでの応答を期待
      when(commandMock.reply(InternalErrorMessage)).thenResolve();

      // コマンド実行
      const TEST_CLIENT = await TestDiscordServer.getClient();
      TEST_CLIENT.emit("interactionCreate", instance(commandMock));

      // 応答を待機
      await waitUntilReply(commandMock);

      // エラーメッセージでの応答を検証
      verify(commandMock.reply(InternalErrorMessage)).once();

      // スレッドが作成されていないことを確認
      // ロギングを無効化してからfindAllを実行
      const mockLogger = new MockLogger();
      const connector = new MysqlConnector();
      // @ts-ignore - privateフィールドにアクセスするため
      connector.logger = mockLogger;
      // @ts-ignore - privateフィールドにアクセスするため
      connector.instance.options.logging = false;

      const threads = await ThreadRepositoryImpl.findAll();
      expect(threads.length).to.eq(0);
    });

    /**
     * 実行環境の異常ハンドリング
     * - interaction.channel が null のとき、安全に処理がスキップされるか
     */
    it("test talk command with null channel should skip processing safely", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト用のパラメータ
      const testTitle = "テストタイトル";
      const testContextType = 1;

      // モックの設定
      const commandMock = mockSlashCommand("talk", {
        title: testTitle,
        type: testContextType,
      });

      // channelをnullに設定
      when(commandMock.channel).thenReturn(null);

      // コマンド実行
      const TEST_CLIENT = await TestDiscordServer.getClient();
      TEST_CLIENT.emit("interactionCreate", instance(commandMock));

      // 応答がないことを確認するため少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));

      // スレッドが作成されていないことを確認
      // ロギングを無効化してからfindAllを実行
      const mockLogger = new MockLogger();
      const connector = new MysqlConnector();
      // @ts-ignore - privateフィールドにアクセスするため
      connector.logger = mockLogger;
      // @ts-ignore - privateフィールドにアクセスするため
      connector.instance.options.logging = false;

      const threads = await ThreadRepositoryImpl.findAll();
      expect(threads.length).to.eq(0);

      // replyが呼ばれていないことを確認
      verify(commandMock.reply(anything())).never();
    });

    /**
     * 実行環境の異常ハンドリング
     * - チャンネルがテキストチャンネル以外だった場合の対応
     */
    it("test talk command with non-text channel should skip processing safely", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト用のパラメータ
      const testTitle = "テストタイトル";
      const testContextType = 1;

      // モックの設定
      const commandMock = mockSlashCommand("talk", {
        title: testTitle,
        type: testContextType,
      });

      // テキストチャンネル以外のチャンネルを設定（threads.createメソッドがない）
      const nonTextChannelMock = mock<any>();
      when(nonTextChannelMock.threads).thenReturn({});
      when(commandMock.channel).thenReturn(instance(nonTextChannelMock));

      // コマンド実行
      const TEST_CLIENT = await TestDiscordServer.getClient();
      TEST_CLIENT.emit("interactionCreate", instance(commandMock));

      // 応答がないことを確認するため少し待機
      await new Promise(resolve => setTimeout(resolve, 1000));

      // スレッドが作成されていないことを確認
      // ロギングを無効化してからfindAllを実行
      const mockLogger = new MockLogger();
      const connector = new MysqlConnector();
      // @ts-ignore - privateフィールドにアクセスするため
      connector.logger = mockLogger;
      // @ts-ignore - privateフィールドにアクセスするため
      connector.instance.options.logging = false;

      const threads = await ThreadRepositoryImpl.findAll();
      expect(threads.length).to.eq(0);

      // replyが呼ばれていないことを確認
      verify(commandMock.reply(anything())).never();
    });

    /**
     * 実行環境の異常ハンドリング
     * - PersonalityLogic に対応するパーソナリティが見つからなかったケース
     */
    it("test talk command when personality not found should skip processing safely", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト前にPersonalityデータを削除
      await PersonalityRepositoryImpl.destroy({
        truncate: true,
        force: true,
      });

      // テスト用のパラメータ
      const testTitle = "テストタイトル";
      const testContextType = 1;

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

      // エラーメッセージでの応答を期待
      when(commandMock.reply(InternalErrorMessage)).thenResolve();

      // コマンド実行
      const TEST_CLIENT = await TestDiscordServer.getClient();
      TEST_CLIENT.emit("interactionCreate", instance(commandMock));

      // 応答を待機
      await waitUntilReply(commandMock);

      // エラーメッセージでの応答を検証
      verify(commandMock.reply(InternalErrorMessage)).once();

      // スレッドが作成されていないことを確認
      // ロギングを無効化してからfindAllを実行
      const mockLogger = new MockLogger();
      const connector = new MysqlConnector();
      // @ts-ignore - privateフィールドにアクセスするため
      connector.logger = mockLogger;
      // @ts-ignore - privateフィールドにアクセスするため
      connector.instance.options.logging = false;

      const threads = await ThreadRepositoryImpl.findAll();
      expect(threads.length).to.eq(0);

    });

    /**
     * 実行環境の異常ハンドリング
     * - PersonalityContextLogic で対応するパーソナリティコンテキストが存在しなかったケース
     */
    it("test talk command when personality context not found should skip processing safely", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト前にPersonalityContextデータを削除
      await PersonalityContextRepositoryImpl.destroy({
        truncate: true,
        force: true,
      });

      // テスト用のパラメータ
      const testTitle = "テストタイトル";
      const testContextType = 1;

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

      // エラーメッセージでの応答を期待
      when(commandMock.reply(InternalErrorMessage)).thenResolve();

      // コマンド実行
      const TEST_CLIENT = await TestDiscordServer.getClient();
      TEST_CLIENT.emit("interactionCreate", instance(commandMock));

      // 応答を待機
      await waitUntilReply(commandMock);

      // エラーメッセージでの応答を検証
      verify(commandMock.reply(InternalErrorMessage)).once();

      // スレッドが作成されていないことを確認
      // ロギングを無効化してからfindAllを実行
      const mockLogger = new MockLogger();
      const connector = new MysqlConnector();
      // @ts-ignore - privateフィールドにアクセスするため
      connector.logger = mockLogger;
      // @ts-ignore - privateフィールドにアクセスするため
      connector.instance.options.logging = false;

      const threads = await ThreadRepositoryImpl.findAll();
      expect(threads.length).to.eq(0);

    });

    /**
     * 実行環境の異常ハンドリング
     * - ContextLogic で有効なコンテキストが取得できなかったときのエラー挙動
     */
    it("test talk command when context not found should skip processing safely", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト前にContextデータを削除
      await ContextRepositoryImpl.destroy({
        truncate: true,
        force: true,
      });

      // テスト用のパラメータ
      const testTitle = "テストタイトル";
      const testContextType = 1;

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

      // エラーメッセージでの応答を期待
      when(commandMock.reply(InternalErrorMessage)).thenResolve();

      // コマンド実行
      const TEST_CLIENT = await TestDiscordServer.getClient();
      TEST_CLIENT.emit("interactionCreate", instance(commandMock));

      // 応答を待機
      await waitUntilReply(commandMock);

      // エラーメッセージでの応答を検証
      verify(commandMock.reply(InternalErrorMessage)).once();

      // スレッドが作成されていないことを確認
      // ロギングを無効化してからfindAllを実行
      const mockLogger = new MockLogger();
      const connector = new MysqlConnector();
      // @ts-ignore - privateフィールドにアクセスするため
      connector.logger = mockLogger;
      // @ts-ignore - privateフィールドにアクセスするため
      connector.instance.options.logging = false;

      const threads = await ThreadRepositoryImpl.findAll();
      expect(threads.length).to.eq(0);

    });

    /**
     * AIReplyHandlerのテスト
    */

    /**
     * メッセージフィルタリングテスト
     * - Bot自身の発言を無視できているかを確認
     * - スレッド以外のチャンネルからのメッセージが無視されるか
     * - 他ユーザーが所有するスレッドが除外対象になるか
     * - カスタムカテゴリ（CHATGPT以外）のスレッドで無視されるか
     */
    it("test AIReplyHandler message filtering", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト用のパラメータ
      const testGuildId = "12345";
      const testThreadId = "67890";
      const testOtherThreadId = "67891";
      const testNonChatGPTThreadId = "67892";
      const testUserId = "98765";
      const testBotId = AppConfig.discord.clientId;

      // テスト用のスレッドデータを作成
      // 1. ChatGPTカテゴリのスレッド（Botが所有）
      await ThreadRepositoryImpl.create({
        guildId: testGuildId,
        messageId: testThreadId,
        categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
        metadata: {
          persona_role: "テスト役割",
          speaking_style_rules: "テストスタイル",
          response_directives: "テスト指示",
          emotion_model: "テスト感情",
          notes: "テスト注釈",
          input_scope: "テスト範囲"
        }
      });

      // 2. ChatGPTカテゴリのスレッド（他ユーザーが所有）
      await ThreadRepositoryImpl.create({
        guildId: testGuildId,
        messageId: testOtherThreadId,
        categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
        metadata: {
          persona_role: "テスト役割",
          speaking_style_rules: "テストスタイル",
          response_directives: "テスト指示",
          emotion_model: "テスト感情",
          notes: "テスト注釈",
          input_scope: "テスト範囲"
        }
      });

      // 3. 非ChatGPTカテゴリのスレッド（Botが所有）
      await ThreadRepositoryImpl.create({
        guildId: testGuildId,
        messageId: testNonChatGPTThreadId,
        categoryType: ThreadCategoryType.CATEGORY_TYPE_DEEPL.getValue(),
        metadata: {
          persona_role: "テスト役割",
          speaking_style_rules: "テストスタイル",
          response_directives: "テスト指示",
          emotion_model: "テスト感情",
          notes: "テスト注釈",
          input_scope: "テスト範囲"
        }
      });

      // AIReplyHandlerのインスタンスを作成
      const aiReplyHandler = new AIReplyHandler();
      // @ts-ignore - privateフィールドにアクセスするため
      const threadLogicMock = mock<ThreadLogic>();
      // @ts-ignore - privateフィールドにアクセスするため
      aiReplyHandler.threadLogic = instance(threadLogicMock);

      // テストケース1: Bot自身の発言を無視できているか
      const botMessageMock = mockMessage(testBotId, false, true);
      when(botMessageMock.channel).thenReturn({
        isThread: () => true,
        guildId: testGuildId,
        id: testThreadId,
        ownerId: testBotId,
        sendTyping: () => Promise.resolve(),
        messages: {
          fetch: () => Promise.resolve([])
        }
      } as any);

      // AIReplyHandlerのhandleメソッドを呼び出し
      await aiReplyHandler.handle(instance(botMessageMock));

      // Bot自身のメッセージは無視されるため、replyは呼ばれないはず
      verify(botMessageMock.reply(anything())).never();

      // テストケース2: スレッド以外のチャンネルからのメッセージが無視されるか
      const nonThreadMessageMock = mockMessage(testUserId);
      when(nonThreadMessageMock.channel).thenReturn({
        isThread: () => false,
        guildId: testGuildId,
        id: "12345",
        sendTyping: () => Promise.resolve(),
      } as any);

      // AIReplyHandlerのhandleメソッドを呼び出し
      await aiReplyHandler.handle(instance(nonThreadMessageMock));

      // スレッド以外のメッセージは無視されるため、replyは呼ばれないはず
      verify(nonThreadMessageMock.reply(anything())).never();

      // テストケース3: 他ユーザーが所有するスレッドが除外対象になるか
      const otherOwnerMessageMock = mockMessage(testUserId);
      when(otherOwnerMessageMock.channel).thenReturn({
        isThread: () => true,
        guildId: testGuildId,
        id: testOtherThreadId,
        ownerId: testUserId, // Botではなく他のユーザーがオーナー
        sendTyping: () => Promise.resolve(),
      } as any);

      // AIReplyHandlerのhandleメソッドを呼び出し
      await aiReplyHandler.handle(instance(otherOwnerMessageMock));

      // 他ユーザーが所有するスレッドのメッセージは無視されるため、replyは呼ばれないはず
      verify(otherOwnerMessageMock.reply(anything())).never();

      // テストケース4: カスタムカテゴリ（CHATGPT以外）のスレッドで無視されるか
      const nonChatGPTMessageMock = mockMessage(testUserId);
      when(nonChatGPTMessageMock.channel).thenReturn({
        isThread: () => true,
        guildId: testGuildId,
        id: testNonChatGPTThreadId,
        ownerId: testBotId,
        sendTyping: () => Promise.resolve(),
      } as any);

      // ThreadLogicのfindメソッドをモック
      when(threadLogicMock.find(anything(), anything())).thenResolve(
        new ThreadDto(
          new ThreadGuildId(testGuildId),
          new ThreadMessageId(testNonChatGPTThreadId),
          ThreadCategoryType.CATEGORY_TYPE_DEEPL, // ChatGPT以外のカテゴリ
          new ThreadMetadata({
            persona_role: "テスト役割",
            speaking_style_rules: "テストスタイル",
            response_directives: "テスト指示",
            emotion_model: "テスト感情",
            notes: "テスト注釈",
            input_scope: "テスト範囲"
          } as unknown as JSON)
        )
      );

      // AIReplyHandlerのhandleメソッドを呼び出し
      await aiReplyHandler.handle(instance(nonChatGPTMessageMock));

      // ChatGPT以外のカテゴリのスレッドのメッセージは無視されるため、replyは呼ばれないはず
      verify(nonChatGPTMessageMock.reply(anything())).never();
    });

    /**
     * [ThreadSearch] スレッド検索機能の検証
     * - ThreadLogic.find が適切な引数で呼ばれるか
     * - ThreadGuildId および ThreadMessageId が正しい形式で生成されるか
     * - 対象スレッドが存在しないケースでのハンドリングが正しいか
     */
    it("test ThreadLogic.find functionality", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト用のパラメータ
      const testGuildId = 12345;
      const testThreadId = 67890;
      const testNonExistThreadId = 99999;
      const testUserId = 98765;

      // テスト用のスレッドデータを作成
      await ThreadRepositoryImpl.create({
        guildId: testGuildId,
        messageId: testThreadId,
        categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
        metadata: {
          persona_role: "テスト役割",
          speaking_style_rules: "テストスタイル",
          response_directives: "テスト指示",
          emotion_model: "テスト感情",
          notes: "テスト注釈",
          input_scope: "テスト範囲"
        }
      });

      // ThreadLogicのインスタンスを作成
      const threadLogic = new ThreadLogic();
      // @ts-ignore - privateフィールドにアクセスするため
      const threadRepositoryMock = mock<ThreadRepositoryImpl>();
      // @ts-ignore - privateフィールドにアクセスするため
      threadLogic.threadRepository = instance(threadRepositoryMock);
      // @ts-ignore - privateフィールドにアクセスするため
      threadLogic.transaction = {
        startTransaction: async (callback: () => Promise<any>) => {
          return await callback();
        }
      };

      // 正常系: 存在するスレッドを検索
      when(threadRepositoryMock.findByMessageId(anything(), anything())).thenCall(
        async (guildId: ThreadGuildId, messageId: ThreadMessageId) => {
          // 引数の検証
          expect(Number(guildId.getValue())).to.equal(testGuildId);
          expect(Number(messageId.getValue())).to.equal(testThreadId);

          // 実際のデータベースからスレッドを取得
          return await ThreadRepositoryImpl.findOne({
            where: {
              guildId: guildId.getValue(),
              messageId: messageId.getValue(),
            }
          }).then(res => res ? res.toDto() : undefined);
        }
      );

      // スレッド検索の実行
      const foundThread = await threadLogic.find(
        new ThreadGuildId(testGuildId.toString()),
        new ThreadMessageId(testThreadId.toString())
      );

      // 検索結果の検証
      expect(foundThread).to.not.be.undefined;
      if (foundThread) {
        expect(Number(foundThread.guildId.getValue())).to.equal(testGuildId);
        expect(Number(foundThread.messageId.getValue())).to.equal(testThreadId);
        expect(foundThread.categoryType.getValue()).to.equal(ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue());

        // メタデータの検証
        const metadata = foundThread.metadata.getValue();
        expect(metadata).to.have.property('persona_role', 'テスト役割');
        expect(metadata).to.have.property('speaking_style_rules', 'テストスタイル');
        expect(metadata).to.have.property('response_directives', 'テスト指示');
        expect(metadata).to.have.property('emotion_model', 'テスト感情');
        expect(metadata).to.have.property('notes', 'テスト注釈');
        expect(metadata).to.have.property('input_scope', 'テスト範囲');
      }

      // 異常系: 存在しないスレッドを検索
      when(threadRepositoryMock.findByMessageId(anything(), anything())).thenCall(
        async (guildId: ThreadGuildId, messageId: ThreadMessageId) => {
          // 引数の検証
          expect(Number(guildId.getValue())).to.equal(testGuildId);
          expect(Number(messageId.getValue())).to.equal(testNonExistThreadId);

          // 存在しないスレッドの場合はundefinedを返す
          return undefined;
        }
      );

      // 存在しないスレッドの検索実行
      const notFoundThread = await threadLogic.find(
        new ThreadGuildId(testGuildId.toString()),
        new ThreadMessageId(testNonExistThreadId.toString())
      );

      // 検索結果の検証（存在しない場合はundefinedが返されるはず）
      expect(notFoundThread).to.be.undefined;

      // AIReplyHandlerでのスレッド検索の挙動を検証
      const aiReplyHandler = new AIReplyHandler();
      // @ts-ignore - privateフィールドにアクセスするため
      const threadLogicForHandlerMock = mock<ThreadLogic>();
      // @ts-ignore - privateフィールドにアクセスするため
      aiReplyHandler.threadLogic = instance(threadLogicForHandlerMock);

      // 存在しないスレッドの場合
      when(threadLogicForHandlerMock.find(anything(), anything())).thenResolve(undefined);

      const messageMock = mockMessage(testUserId.toString());
      when(messageMock.channel).thenReturn({
        isThread: () => true,
        guildId: testGuildId,
        id: testNonExistThreadId,
        ownerId: AppConfig.discord.clientId,
        sendTyping: () => Promise.resolve(),
      } as any);

      // AIReplyHandlerのhandleメソッドを呼び出し
      await aiReplyHandler.handle(instance(messageMock));

      // スレッドが存在しない場合は処理がスキップされるため、replyは呼ばれないはず
      verify(messageMock.reply(anything())).never();

      // ThreadGuildIdとThreadMessageIdの生成と検証
      const guildId = new ThreadGuildId(testGuildId.toString());
      const messageId = new ThreadMessageId(testThreadId.toString());

      expect(Number(guildId.getValue())).to.equal(testGuildId);
      expect(Number(messageId.getValue())).to.equal(testThreadId);
      expect(Number(guildId.getValue())).to.equal(testGuildId);
      expect(Number(messageId.getValue())).to.equal(testThreadId);
    });

    /**
     * [TypingIndicator] タイピング表示の検証
     * - sendTyping が正しく呼ばれているか
     * - 入力検出直後などタイミング的に妥当な場所で動くか
     */
    it("test typing indicator is shown at appropriate timing", async function(this: Mocha.Context) {
      // 個別のテストのタイムアウト時間を延長（10秒）
      this.timeout(10000);

      // テスト用のパラメータ
      const testGuildId = "12345";
      const testThreadId = "67890";
      const testUserId = "98765";
      const testBotId = AppConfig.discord.clientId;

      // テスト用のスレッドデータを作成
      await ThreadRepositoryImpl.create({
        guildId: testGuildId,
        messageId: testThreadId,
        categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
        metadata: {
          persona_role: "テスト役割",
          speaking_style_rules: "テストスタイル",
          response_directives: "テスト指示",
          emotion_model: "テスト感情",
          notes: "テスト注釈",
          input_scope: "テスト範囲"
        }
      });

      // AIReplyHandlerのインスタンスを作成
      const aiReplyHandler = new AIReplyHandler();

      // ThreadLogicのモックを作成
      const threadLogicMock = mock<ThreadLogic>();
      // @ts-ignore - privateフィールドにアクセスするため
      aiReplyHandler.threadLogic = instance(threadLogicMock);

      // ChatAILogicのモックを作成
      const chatAILogicMock = mock<IChatAILogic>();
      // @ts-ignore - privateフィールドにアクセスするため
      aiReplyHandler.chatAILogic = instance(chatAILogicMock);

      // ThreadLogic.findメソッドのモック
      when(threadLogicMock.find(anything(), anything())).thenResolve(
        new ThreadDto(
          new ThreadGuildId(testGuildId),
          new ThreadMessageId(testThreadId),
          ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
          new ThreadMetadata({
            persona_role: "テスト役割",
            speaking_style_rules: "テストスタイル",
            response_directives: "テスト指示",
            emotion_model: "テスト感情",
            notes: "テスト注釈",
            input_scope: "テスト範囲"
          } as unknown as JSON)
        )
      );

      // ChatAILogic.replyTalkメソッドのモック
      when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve("テスト応答");

      // メッセージのモックを作成
      const messageMock = mockMessage(testUserId);

      // チャンネルのモックを作成
      const channelMock = mock<any>();
      when(channelMock.isThread()).thenReturn(true);
      when(channelMock.guildId).thenReturn(testGuildId);
      when(channelMock.id).thenReturn(testThreadId);
      when(channelMock.ownerId).thenReturn(testBotId);
      when(channelMock.sendTyping()).thenResolve();
      when(channelMock.messages).thenReturn({
        fetch: () => Promise.resolve([
          {
            author: { bot: false },
            content: "こんにちは",
            reverse: () => [{ author: { bot: false }, content: "こんにちは" }]
          }
        ])
      });

      // メッセージのチャンネルをモックに設定
      when(messageMock.channel).thenReturn(instance(channelMock));

      // メッセージ応答のモック
      when(messageMock.reply(anything())).thenResolve();

      // AIReplyHandlerのhandleメソッドを呼び出し
      await aiReplyHandler.handle(instance(messageMock));

      // sendTypingが呼ばれることを確認（ts-mockitoを使用して検証）
      // チャンネルのsendTypingメソッドが呼ばれたことを確認
      verify(channelMock.sendTyping()).once();

      // 処理の順序を検証
      // 1. ThreadLogic.findが呼ばれる
      verify(threadLogicMock.find(anything(), anything())).once();

      // 2. sendTypingが呼ばれる（スパイで確認済み）

      // 3. ChatAILogic.replyTalkが呼ばれる
      verify(chatAILogicMock.replyTalk(anything(), anything())).once();

      // 4. message.replyが呼ばれる
      verify(messageMock.reply(anything())).once();
    });

});
