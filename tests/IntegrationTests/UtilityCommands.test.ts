import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import { anything, instance, verify, when } from "ts-mockito";

describe("Test UtilityCommand", () => {
	/**
	 * HelpCommandHandlerのテスト
	 */
	describe("Test /help command", () => {
		/**
		 * [全カテゴリ表示] category:allで全カテゴリのヘルプが表示される
		 * - コマンドが正常に実行されることを検証
		 * - 空文字列が返されないことを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /help category:all", async () => {
			const commandMock = mockSlashCommand("help", {
				category: "all",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();
		});

		/**
		 * [utilityカテゴリ表示] category:utilityカテゴリーでutility関連コマンドが表示される
		 * - レスポンスに「utilityカテゴリー」が含まれることを検証
		 * - レスポンスにutilityカテゴリのコマンド（/help, /waiwai, /parrot, /dice, /choice）が含まれることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /help category:utilityカテゴリー", async () => {
			const commandMock = mockSlashCommand("help", {
				category: "utilityカテゴリー",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();
			// Check that response contains specific category commands
			expect(value).to.include("utilityカテゴリー");
			expect(value).to.include("/help");
			expect(value).to.include("/waiwai");
			expect(value).to.include("/parrot");
			expect(value).to.include("/dice");
			expect(value).to.include("/choice");
		});

		/**
		 * [chatカテゴリ表示] category:chatカテゴリーでchat関連コマンドが表示される
		 * - レスポンスに「chatカテゴリー」が含まれることを検証
		 * - レスポンスにchatカテゴリのコマンド（/translate, /talk）が含まれることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /help category:chatカテゴリー", async () => {
			const commandMock = mockSlashCommand("help", {
				category: "chatカテゴリー",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();
			// Check that response contains specific category commands
			expect(value).to.include("chatカテゴリー");
			expect(value).to.include("/translate");
			expect(value).to.include("/talk");
		});

		/**
		 * [reminderカテゴリ表示] category:reminderカテゴリーでreminder関連コマンドが表示される
		 * - レスポンスに「reminderカテゴリー」が含まれることを検証
		 * - レスポンスにreminderカテゴリのコマンド（/reminderset, /reminderdelete, /reminderlist）が含まれることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /help category:reminderカテゴリー", async () => {
			const commandMock = mockSlashCommand("help", {
				category: "reminderカテゴリー",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();
			// Check that response contains specific category commands
			expect(value).to.include("reminderカテゴリー");
			expect(value).to.include("/reminderset");
			expect(value).to.include("/reminderdelete");
			expect(value).to.include("/reminderlist");
		});

		/**
		 * [candyカテゴリ表示] category:candyカテゴリーでcandy関連コマンドが表示される
		 * - レスポンスに「candyカテゴリー」が含まれることを検証
		 * - レスポンスにcandyカテゴリのコマンド（/candycheck, /candydraw）が含まれることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /help category:candyカテゴリー", async () => {
			const commandMock = mockSlashCommand("help", {
				category: "candyカテゴリー",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();
			// Check that response contains specific category commands
			expect(value).to.include("candyカテゴリー");
			expect(value).to.include("/candycheck");
			expect(value).to.include("/candydraw");
		});

		/**
		 * [reviewカテゴリ表示] category:reviewカテゴリーでreview関連コマンドが表示される
		 * - レスポンスに「reviewカテゴリー」が含まれることを検証
		 * - レスポンスにreviewカテゴリのコマンド（/reviewgacha, /reviewlist）が含まれることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /help category:reviewカテゴリー", async () => {
			const commandMock = mockSlashCommand("help", {
				category: "reviewカテゴリー",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();
			// Check that response contains specific category commands
			expect(value).to.include("reviewカテゴリー");
			expect(value).to.include("/reviewgacha");
			expect(value).to.include("/reviewlist");
		});

		/**
		 * [minecraftカテゴリ表示] category:minecraftカテゴリーでminecraft関連コマンドが表示される
		 * - レスポンスに「minecraftカテゴリー」が含まれることを検証
		 * - レスポンスにminecraftカテゴリのコマンド（/minecraftstart, /minecraftstop）が含まれることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /help category:minecraftカテゴリー", async () => {
			const commandMock = mockSlashCommand("help", {
				category: "minecraftカテゴリー",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();
			// Check that response contains specific category commands
			expect(value).to.include("minecraftカテゴリー");
			expect(value).to.include("/minecraftstart");
			expect(value).to.include("/minecraftstop");
		});

		/**
		 * [stickyカテゴリ表示] category:stickyカテゴリーでsticky関連コマンドが表示される
		 * - レスポンスに「stickyカテゴリー」が含まれることを検証
		 * - レスポンスにstickyカテゴリのコマンド（/stickycreate, /stickydelete）が含まれることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /help category:stickyカテゴリー", async () => {
			const commandMock = mockSlashCommand("help", {
				category: "stickyカテゴリー",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).never();
			// Check that response contains specific category commands
			expect(value).to.include("stickyカテゴリー");
			expect(value).to.include("/stickycreate");
			expect(value).to.include("/stickydelete");
		});

		/**
		 * [存在しないカテゴリ] category:invalidで空文字列が返される
		 * - 存在しないカテゴリを指定した場合に空文字列が返されることを検証
		 */
		it("Test /help category:invalid (non-existent category)", async () => {
			const commandMock = mockSlashCommand("help", {
				category: "invalid_category",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			// Non-existent category should return empty string
			expect(value).to.equal("");
		});

		/**
		 * [パラメータなし] category:nullで内部エラーが発生する
		 * - カテゴリが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /help category:null", async () => {
			const commandMock = mockSlashCommand("help");
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(InternalErrorMessage)).once();
		});
	});

	/**
	 * WaiwaiCommandHandlerのテスト
	 */
	describe("Test /waiwai command", () => {
		/**
		 * [正常系] /waiwaiコマンドで「waiwai」が返される
		 * - コマンド実行時に「waiwai」が返されることを検証
		 */
		it("Test /waiwai", async () => {
			const commandMock = mockSlashCommand("waiwai");
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply("waiwai")).once();
		});
	});

	/**
	 * ParrotCommandHandlerのテスト
	 */
	describe("Test /parrot command", () => {
		/**
		 * [日本語メッセージ] message:あああああで入力メッセージがそのまま返される
		 * - 日本語の入力メッセージがそのまま返されることを検証
		 */
		it("Test /parrot message:あああああ", async () => {
			const message = "あああああ";
			const commandMock = mockSlashCommand("parrot", {
				message: message,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(message)).once();
		});

		/**
		 * [英語メッセージ] message:hello worldで入力メッセージがそのまま返される
		 * - 英語（スペース含む）の入力メッセージがそのまま返されることを検証
		 */
		it("Test /parrot message:hello world", async () => {
			const message = "hello world";
			const commandMock = mockSlashCommand("parrot", {
				message: message,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(message)).once();
		});

		/**
		 * [空文字列] message:空文字列で空文字列が返される
		 * - 空文字列を入力した場合に空文字列が返されることを検証
		 */
		it("Test /parrot message:empty string", async () => {
			const message = "";
			const commandMock = mockSlashCommand("parrot", {
				message: message,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(message)).once();
		});

		/**
		 * [パラメータなし] message:nullで内部エラーが発生する
		 * - メッセージが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /parrot message:null", async () => {
			const commandMock = mockSlashCommand("parrot");
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});
	});

	/**
	 * DiceCommandHandlerのテスト
	 */
	describe("Test /dice command", () => {
		/**
		 * [ランダム値] parameter:randomでランダムな面数のダイスが正しく動作する
		 * - 10回のランダム試行で結果が1以上、指定面数以下であることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /dice parameter:random", async () => {
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = 0;
			for (let i = 0; i < 10; i++) {
				const sides = Math.round(Math.random() * Number.MAX_SAFE_INTEGER);
				const commandMock = mockSlashCommand("dice", {
					parameter: sides,
				});

				when(commandMock.reply(anything())).thenCall((args) => {
					value = args;
				});

				TEST_CLIENT.emit("interactionCreate", instance(commandMock));
				await waitUntilReply(commandMock);
				verify(commandMock.reply(anything())).once();
				verify(commandMock.reply(InternalErrorMessage)).never();
				expect(Number(value)).to.lte(sides);
				expect(Number(value)).to.gte(1);
			}
		}).timeout(20_000);

		/**
		 * [最小値] parameter:1で1面ダイスが常に1を返す
		 * - 1面ダイスの場合、常に1が返されることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /dice parameter:1 (minimum value)", async () => {
			const commandMock = mockSlashCommand("dice", {
				parameter: 1,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).never();
			// When dice has only 1 side, it should always return 1
			expect(value).to.equal("1");
		});

		/**
		 * [標準ダイス] parameter:6で6面ダイスが1〜6の範囲で返される
		 * - 6面ダイスの結果が1〜6の範囲内であることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /dice parameter:6 (standard dice)", async () => {
			const commandMock = mockSlashCommand("dice", {
				parameter: 6,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).never();
			expect(Number(value)).to.be.within(1, 6);
		});

		/**
		 * [100面ダイス] parameter:100で100面ダイスが1〜100の範囲で返される
		 * - 100面ダイスの結果が1〜100の範囲内であることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /dice parameter:100", async () => {
			const commandMock = mockSlashCommand("dice", {
				parameter: 100,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).never();
			expect(Number(value)).to.be.within(1, 100);
		});

		/**
		 * [パラメータなし] parameter:nullで内部エラーが発生する
		 * - パラメータが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /dice parameter:null", async () => {
			const commandMock = mockSlashCommand("dice", {
				parameter: null,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("")).never();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [小数値エラー] parameter:3.14159265で整数でないエラーメッセージが返される
		 * - 小数値を指定した場合に「パラメーターが整数じゃないよ！っ」が返されることを検証
		 */
		it("Test /dice parameter:3.14159265 (non-integer)", async () => {
			const commandMock = mockSlashCommand("dice", {
				parameter: Math.PI,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("パラメーターが整数じゃないよ！っ")).once();
		});

		/**
		 * [負数エラー] parameter:-1で0以下のエラーメッセージが返される
		 * - 負の数を指定した場合に「パラメーターが0以下の数だよ！っ」が返されることを検証
		 */
		it("Test /dice parameter:-1 (negative number)", async () => {
			const commandMock = mockSlashCommand("dice", {
				parameter: -1,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("パラメーターが0以下の数だよ！っ")).once();
		});

		/**
		 * [ゼロエラー] parameter:0で0以下のエラーメッセージが返される
		 * - 0を指定した場合に「パラメーターが0以下の数だよ！っ」が返されることを検証
		 */
		it("Test /dice parameter:0 (zero)", async () => {
			const commandMock = mockSlashCommand("dice", {
				parameter: 0,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply("パラメーターが0以下の数だよ！っ")).once();
		});
	});

	/**
	 * ChoiceCommandHandlerのテスト
	 */
	describe("Test /choice command", () => {
		/**
		 * [複数日本語選択肢] parameter:ああああ いいいい うううう ええええ おおおおで選択肢からランダムに選ばれる
		 * - 繰り返し実行で全ての選択肢が選ばれることを検証
		 * - 選択結果が指定した選択肢のいずれかであることを検証
		 */
		it("Test /choice parameter:ああああ いいいい うううう ええええ おおおお", async () => {
			const choices = ["ああああ", "いいいい", "うううう", "ええええ", "おおおお"];
			let notChoices = choices;
			do {
				const commandMock = mockSlashCommand("choice", {
					items: choices.join(" "),
				});
				const TEST_CLIENT = await TestDiscordServer.getClient();
				let value = "";
				when(commandMock.reply(anything())).thenCall((args) => {
					value = args;
				});

				TEST_CLIENT.emit("interactionCreate", instance(commandMock));
				await waitUntilReply(commandMock);

				verify(commandMock.reply(anything())).once();
				expect(choices).to.be.an("array").that.includes(value);
				if (notChoices.includes(value)) {
					notChoices = notChoices.toSpliced(notChoices.indexOf(value), 1);
				}
			} while (notChoices.length !== 0);
			expect(notChoices).to.deep.eq([]);
		}).timeout(10_000);

		/**
		 * [単一選択肢] parameter:single itemで単一の選択肢がそのまま返される
		 * - 選択肢が1つの場合、その選択肢がそのまま返されることを検証
		 */
		it("Test /choice parameter:single item", async () => {
			const commandMock = mockSlashCommand("choice", {
				items: "only_one",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(value).to.equal("only_one");
		});

		/**
		 * [2つの選択肢] parameter:two itemsで2つの選択肢からランダムに選ばれる
		 * - 選択結果がappleまたはorangeのいずれかであることを検証
		 */
		it("Test /choice parameter:two items", async () => {
			const commandMock = mockSlashCommand("choice", {
				items: "apple orange",
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(["apple", "orange"]).to.include(value);
		});

		/**
		 * [英語選択肢] parameter:english wordsで英語の選択肢からランダムに選ばれる
		 * - 選択結果がapple、banana、cherryのいずれかであることを検証
		 */
		it("Test /choice parameter:english words", async () => {
			const choices = ["apple", "banana", "cherry"];
			const commandMock = mockSlashCommand("choice", {
				items: choices.join(" "),
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(choices).to.include(value);
		});

		/**
		 * [パラメータなし] parameter:nullで内部エラーが発生する
		 * - パラメータが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /choice parameter:null", async () => {
			const commandMock = mockSlashCommand("choice");
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});
	});
});
