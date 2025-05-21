import "reflect-metadata";
import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { StickyCreateCommandHandler } from "@/src/handlers/discord.js/commands/StickyCreateCommandHandler";
import { StickyLogic } from "@/src/logics/StickyLogic";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { expect } from "chai";
import { anything, instance, mock, verify, when } from "ts-mockito";
import type Mocha from "mocha";
import { Container } from "inversify";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import type { ChatInputCommandInteraction, CacheType } from "discord.js";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { StickyMessage } from "@/src/entities/vo/StickyMessage";
import { StickyDto } from "@/src/entities/dto/StickyDto";
import { ActionRowBuilder, ModalBuilder, TextChannel, TextInputBuilder, TextInputStyle } from "discord.js";

describe("Test Sticky Commands", () => {
  /**
   * テスト実行前に毎回実行される共通のセットアップ
   */
  beforeEach(() => {
    new MysqlConnector();
  });

  /**
   * [権限チェック] 管理者権限がない場合はスティッキーを作成できない
   * - verifyで権限チェックが行われることを検証
   * - verify権限がない場合にエラーメッセージが返されることを検証
   * - verifyStickyLogicのcreateメソッドが呼ばれないことを検証
   */
  it("should not create sticky when user does not have admin permission", function(this: Mocha.Context) {
    this.timeout(10_000);

    // 非管理者ユーザーIDを設定
    const nonAdminUserId = "9999";

    // RoleConfigのモック
    // 実際のRoleConfigを使用するが、テスト用のユーザーが管理者でないことを確認
    const originalUsers = RoleConfig.users;
    (RoleConfig as any).users = [
      ...originalUsers,
      { discordId: nonAdminUserId, role: "user" } // 非管理者ユーザーを追加
    ];

    // StickyLogicのモックを作成
    const stickyLogicMock = mock(StickyLogic);
    const stickyLogicInstance = instance(stickyLogicMock);

    // DIコンテナを設定
    const container = new Container();
    container.bind<StickyCreateCommandHandler>(StickyCreateCommandHandler).toSelf();
    container.bind<StickyLogic>(LogicTypes.StickyLogic).toConstantValue(stickyLogicInstance);

    // ハンドラーのインスタンスを作成
    const handler = container.get<StickyCreateCommandHandler>(StickyCreateCommandHandler);

    // インタラクションのモックを作成
    const interactionMock = mock<ChatInputCommandInteraction<CacheType>>();

    // 必要なプロパティとメソッドをモック
    when(interactionMock.guildId).thenReturn("1234567890");
    when(interactionMock.user).thenReturn({ id: nonAdminUserId } as any);
    when(interactionMock.channel).thenReturn({} as any);

    // replyメソッドをモック
    let replyValue = "";
    when(interactionMock.reply(anything())).thenCall((message: string) => {
      replyValue = message;
      console.log("Reply received:", message);
      return Promise.resolve({} as any);
    });

    // ハンドラーを直接呼び出す
    handler.handle(instance(interactionMock));

    // 応答の検証
    verify(interactionMock.reply(anything())).once();
    expect(replyValue).to.eq("スティッキーを登録する権限を持っていないよ！っ");

    // StickyLogicのcreateメソッドが呼ばれていないことを確認
    verify(stickyLogicMock.create(anything())).never();

    // テスト後にRoleConfigを元に戻す
    (RoleConfig as any).users = originalUsers;
  });

  /**
   * [既存チェック] 既にスティッキーが登録されているチャンネルには新規作成できない
   * - verifyStickyLogic.findが呼ばれることを検証
   * - verifyスティッキーが既に存在する場合にエラーメッセージが返されることを検証
   * - verifyStickyLogic.createが呼ばれないことを検証
   */
  it("should not create sticky when channel already has a sticky", async function(this: Mocha.Context) {
    this.timeout(10_000);

    // 管理者ユーザーIDを設定
    const adminUserId = "1234";

    // RoleConfigのモック
    // 実際のRoleConfigを使用するが、テスト用のユーザーが管理者であることを確認
    const originalUsers = RoleConfig.users;
    (RoleConfig as any).users = [
      ...originalUsers,
      { discordId: adminUserId, role: "admin" } // 管理者ユーザーを追加
    ];

    // テスト用のチャンネルID
    const channelId = "5678";
    const guildId = "1234567890";

    // 既存のスティッキーデータを作成
    const existingSticky = new StickyDto(
      new DiscordGuildId(guildId),
      new DiscordChannelId(channelId),
      new DiscordUserId(adminUserId),
      new DiscordMessageId("9876"),
      new StickyMessage("既存のスティッキーメッセージ")
    );

    // StickyLogicのモックを作成
    const stickyLogicMock = mock(StickyLogic);
    const stickyLogicInstance = instance(stickyLogicMock);

    // findメソッドが既存のスティッキーを返すようにモック
    when(stickyLogicMock.find(anything(), anything())).thenResolve(existingSticky);

    // DIコンテナを設定
    const container = new Container();
    container.bind<StickyCreateCommandHandler>(StickyCreateCommandHandler).toSelf();
    container.bind<StickyLogic>(LogicTypes.StickyLogic).toConstantValue(stickyLogicInstance);

    // ハンドラーのインスタンスを作成
    const handler = container.get<StickyCreateCommandHandler>(StickyCreateCommandHandler);

    // インタラクションのモックを作成
    const interactionMock = mock<ChatInputCommandInteraction<CacheType>>();

    // 必要なプロパティとメソッドをモック
    when(interactionMock.guildId).thenReturn(guildId);
    when(interactionMock.user).thenReturn({ id: adminUserId } as any);
    when(interactionMock.channel).thenReturn({} as any);
    when(interactionMock.guild).thenReturn({ channels: { cache: { get: () => null } } } as any);

    // optionsのモック
    when(interactionMock.options).thenReturn({
      getString: (name: string, required: boolean) => {
        if (name === "channelid") {
          return channelId;
        }
        return null;
      }
    } as any);

    // replyメソッドをモック
    let replyValue = "";
    when(interactionMock.reply(anything())).thenCall((message: string) => {
      replyValue = message;
      console.log("Reply received:", message);
      return Promise.resolve({} as any);
    });

    // ハンドラーを直接呼び出す - 非同期なので await する
    await handler.handle(instance(interactionMock));

    // findメソッドが呼ばれたことを検証
    verify(stickyLogicMock.find(anything(), anything())).once();

    // 応答の検証
    verify(interactionMock.reply(anything())).once();
    expect(replyValue).to.eq("スティッキーが既にチャンネルに登録されているよ！っ");

    // StickyLogicのcreateメソッドが呼ばれていないことを確認
    verify(stickyLogicMock.create(anything())).never();

    // テスト後にRoleConfigを元に戻す
    (RoleConfig as any).users = originalUsers;
  });

  /**
   * [チャンネル検証] TextChannel以外にはスティッキーを登録できない
   * - verifyチャンネルの型チェックが行われることを検証
   * - verifyTextChannel以外の場合にエラーメッセージが返されることを検証
   * - verifyStickyLogic.createが呼ばれないことを検証
   */
  it("should not create sticky when channel is not a TextChannel", async function(this: Mocha.Context) {
    this.timeout(10_000);

    // 管理者ユーザーIDを設定
    const adminUserId = "1234";

    // RoleConfigのモック
    // 実際のRoleConfigを使用するが、テスト用のユーザーが管理者であることを確認
    const originalUsers = RoleConfig.users;
    (RoleConfig as any).users = [
      ...originalUsers,
      { discordId: adminUserId, role: "admin" } // 管理者ユーザーを追加
    ];

    // テスト用のチャンネルID
    const channelId = "5678";
    const guildId = "1234567890";

    // StickyLogicのモックを作成
    const stickyLogicMock = mock(StickyLogic);
    const stickyLogicInstance = instance(stickyLogicMock);

    // findメソッドが未定義を返すようにモック（チャンネルにスティッキーがない状態）
    when(stickyLogicMock.find(anything(), anything())).thenResolve(undefined);

    // DIコンテナを設定
    const container = new Container();
    container.bind<StickyCreateCommandHandler>(StickyCreateCommandHandler).toSelf();
    container.bind<StickyLogic>(LogicTypes.StickyLogic).toConstantValue(stickyLogicInstance);

    // ハンドラーのインスタンスを作成
    const handler = container.get<StickyCreateCommandHandler>(StickyCreateCommandHandler);

    // インタラクションのモックを作成
    const interactionMock = mock<ChatInputCommandInteraction<CacheType>>();

    // 必要なプロパティとメソッドをモック
    when(interactionMock.guildId).thenReturn(guildId);
    when(interactionMock.user).thenReturn({ id: adminUserId } as any);
    when(interactionMock.channel).thenReturn({} as any);

    // TextChannel以外のチャンネルを返すようにモック
    // VoiceChannelやCategoryChannelなど、TextChannel以外のチャンネルタイプを模倣
    const nonTextChannel = { type: "GUILD_VOICE" }; // TextChannel以外のチャンネルタイプ
    when(interactionMock.guild).thenReturn({
      channels: {
        cache: {
          get: (id: string) => id === channelId ? nonTextChannel : null
        }
      }
    } as any);

    // optionsのモック
    when(interactionMock.options).thenReturn({
      getString: (name: string, required: boolean) => {
        if (name === "channelid") {
          return channelId;
        }
        return null;
      }
    } as any);

    // replyメソッドをモック
    let replyValue = "";
    when(interactionMock.reply(anything())).thenCall((message: string) => {
      replyValue = message;
      console.log("Reply received:", message);
      return Promise.resolve({} as any);
    });

    // ハンドラーを直接呼び出す - 非同期なので await する
    await handler.handle(instance(interactionMock));

    // findメソッドが呼ばれたことを検証
    verify(stickyLogicMock.find(anything(), anything())).once();

    // 応答の検証
    verify(interactionMock.reply(anything())).once();
    expect(replyValue).to.eq("このチャンネルにはスティッキーを登録できないよ！っ");

    // StickyLogicのcreateメソッドが呼ばれていないことを確認
    verify(stickyLogicMock.create(anything())).never();

    // テスト後にRoleConfigを元に戻す
    (RoleConfig as any).users = originalUsers;
  });

  /**
   * [モーダル表示] スティッキー作成時にモーダルが表示される
   * - verifyモーダルが表示されることを検証
   * - verifyモーダルに適切なタイトルとフィールドが設定されていることを検証
   */
  it("should display modal with appropriate title and fields when creating sticky", async function(this: Mocha.Context) {
    this.timeout(10_000);

    // 管理者ユーザーIDを設定
    const adminUserId = "1234";

    // RoleConfigのモック
    const originalUsers = RoleConfig.users;
    (RoleConfig as any).users = [
      ...originalUsers,
      { discordId: adminUserId, role: "admin" } // 管理者ユーザーを追加
    ];

    // テスト用のチャンネルID
    const channelId = "5678";
    const guildId = "1234567890";

    // StickyLogicのモックを作成
    const stickyLogicMock = mock(StickyLogic);
    const stickyLogicInstance = instance(stickyLogicMock);

    // findメソッドが未定義を返すようにモック（チャンネルにスティッキーがない状態）
    when(stickyLogicMock.find(anything(), anything())).thenResolve(undefined);

    // DIコンテナを設定
    const container = new Container();
    container.bind<StickyCreateCommandHandler>(StickyCreateCommandHandler).toSelf();
    container.bind<StickyLogic>(LogicTypes.StickyLogic).toConstantValue(stickyLogicInstance);

    // ハンドラーのインスタンスを作成
    const handler = container.get<StickyCreateCommandHandler>(StickyCreateCommandHandler);

    // インタラクションのモックを作成
    const interactionMock = mock<ChatInputCommandInteraction<CacheType>>();

    // 必要なプロパティとメソッドをモック
    when(interactionMock.guildId).thenReturn(guildId);
    when(interactionMock.user).thenReturn({ id: adminUserId } as any);
    when(interactionMock.channel).thenReturn({} as any);

    // TextChannelインスタンスを作成
    // instanceofチェックを通過するためにプロトタイプを設定
    const textChannelInstance = Object.create(TextChannel.prototype);
    // 必要なメソッドを追加
    textChannelInstance.send = (message: string) => {
      return Promise.resolve({ id: "12345", content: message } as any);
    };

    // guildのモックを設定
    when(interactionMock.guild).thenReturn({
      channels: {
        cache: {
          get: (id: string) => id === channelId ? textChannelInstance : null
        }
      }
    } as any);

    // optionsのモック
    when(interactionMock.options).thenReturn({
      getString: (name: string, required: boolean) => {
        if (name === "channelid") {
          return channelId;
        }
        return null;
      }
    } as any);

    // showModalメソッドをモック
    let modalShown: ModalBuilder | null = null;
    when(interactionMock.showModal(anything())).thenCall((modal: ModalBuilder) => {
      modalShown = modal;
      return Promise.resolve();
    });

    // awaitModalSubmitメソッドをモック
    when(interactionMock.awaitModalSubmit(anything())).thenResolve({
      fields: {
        getTextInputValue: () => "テストメッセージ"
      }
    } as any);

    // ハンドラーを直接呼び出す
    await handler.handle(instance(interactionMock));

    // モーダルが表示されたことを検証
    verify(interactionMock.showModal(anything())).once();

    // モーダルが正しく設定されていることを検証
    expect(modalShown).to.not.be.null;
    expect(modalShown!.data.custom_id).to.eq("stickyModal");
    expect(modalShown!.data.title).to.eq("スティッキーの登録");

    // モーダルのコンポーネント（テキスト入力フィールド）を検証
    expect(modalShown!.components.length).to.eq(1);
    const actionRow = modalShown!.components[0] as ActionRowBuilder<TextInputBuilder>;
    const textInput = actionRow.components[0] as TextInputBuilder;

    expect(textInput.data.custom_id).to.eq("stickyInput");
    expect(textInput.data.label).to.eq("スティッキーの文章");
    expect(textInput.data.style).to.eq(TextInputStyle.Paragraph);

    // テスト後にRoleConfigを元に戻す
    (RoleConfig as any).users = originalUsers;
  });

/**

- [モーダル送信] 空のメッセージでモーダルを送信するとエラーになる
- - verify空のメッセージでモーダル送信時にエラーメッセージが返されることを検証
- - verifyStickyLogic.createが呼ばれないことを検証 */
});
