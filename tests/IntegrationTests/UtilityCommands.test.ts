import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { DiceContextDto } from "@/src/entities/dto/DiceContextDto";
import type { DiceResultDto } from "@/src/entities/dto/DiceResultDto";
import { DiceIsSecret } from "@/src/entities/vo/DiceIsSecret";
import { DiceShowDetails } from "@/src/entities/vo/DiceShowDetails";
import { DiceSource } from "@/src/entities/vo/DiceSource";
import { DiceLogic } from "@/src/logics/DiceLogic";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import { anything, instance, verify, when } from "ts-mockito";

const evaluateDice = async (
	source: string,
	showDetails = true,
): Promise<DiceResultDto> => {
	const logic = new DiceLogic();
	const ctx = new DiceContextDto(
		new DiceSource(source),
		new DiceIsSecret(false),
		new DiceShowDetails(showDetails),
	);
	return logic.dice(ctx);
};

const getDescriptionLines = (result: DiceResultDto): string[] => {
	return result.description.getValue().split("\n");
};

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
		const extractEmbedData = (options: any): { title: string; description: string } => {
			const embed = options?.embeds?.[0];
			const data = embed?.data ?? embed;
			return {
				title: data?.title ?? "",
				description: data?.description ?? "",
			};
		};
		const parseEmbedValue = (description: string): number => {
			const match = description.match(/→\s*(-?\d+)/);
			return match ? Number(match[1]) : Number.NaN;
		};

		/**
		 * [ランダム値] source:1d100で1〜100の範囲で返される
		 */
		it("Test /dice source:1d100", async () => {
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let replyOptions: any;
			const commandMock = mockSlashCommand("dice", {
				source: "1d100",
				details: true,
			});
			when(commandMock.reply(anything())).thenCall((args) => {
				replyOptions = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();

			const { description } = extractEmbedData(replyOptions);
			const value = parseEmbedValue(description);
			expect(value).to.be.within(1, 100);
		});

		/**
		 * [最小値] source:1d1で常に1を返す
		 */
		it("Test /dice source:1d1 (minimum value)", async () => {
			const commandMock = mockSlashCommand("dice", {
				source: "1d1",
				details: true,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let replyOptions: any;
			when(commandMock.reply(anything())).thenCall((args) => {
				replyOptions = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();

			const { description } = extractEmbedData(replyOptions);
			const value = parseEmbedValue(description);
			expect(value).to.equal(1);
		});

		/**
		 * [標準ダイス] source:1d6で1〜6の範囲で返される
		 */
		it("Test /dice source:1d6 (standard dice)", async () => {
			const commandMock = mockSlashCommand("dice", {
				source: "1d6",
				details: true,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let replyOptions: any;
			when(commandMock.reply(anything())).thenCall((args) => {
				replyOptions = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();

			const { description } = extractEmbedData(replyOptions);
			const value = parseEmbedValue(description);
			expect(value).to.be.within(1, 6);
		});

		/**
		 * [必須パラメータなし] source:nullで内部エラーが発生する
		 */
		it("Test /dice source:null", async () => {
			const commandMock = mockSlashCommand("dice", {
				source: null,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [構文エラー] source:1.5でパースエラーが返される
		 */
		it("Test /dice source:1.5 (invalid source)", async () => {
			const commandMock = mockSlashCommand("dice", {
				source: "1.5",
				details: true,
			});
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let replyOptions: any;
			when(commandMock.reply(anything())).thenCall((args) => {
				replyOptions = args;
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();

			const { title, description } = extractEmbedData(replyOptions);
			expect(title).to.include("エラー:");
			expect(description).to.include("入力に誤り");
		});
	});

	/**
	 * DiceLogic式評価のテスト
	 */
	describe("DiceLogic expression tests", () => {
		const getLastLine = (result: DiceResultDto): string => {
			const lines = getDescriptionLines(result);
			return lines[lines.length - 1] || "";
		};

		const expectSuccess = (result: DiceResultDto): void => {
			expect(result.ok.getValue()).to.equal(true);
		};

		const expectFailure = (result: DiceResultDto): void => {
			expect(result.ok.getValue()).to.equal(false);
		};

		it("not binds tighter than and/or", async () => {
			const result = await evaluateDice("!1==1&&1==1");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ false ❌");
		});

		it("supports multiple not operators", async () => {
			const result = await evaluateDice("!!1==1");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ true ✅");
		});

		it("and/or are left-associative with same precedence", async () => {
			const result = await evaluateDice("1==1||1==2&&1==2");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ false ❌");
		});

		it("respects arithmetic precedence", async () => {
			const result = await evaluateDice("1+2*3==7");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ true ✅");
		});

		it("parentheses override precedence", async () => {
			const result = await evaluateDice("(1+2)*3==9");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ true ✅");
		});

		it("+ and - share the same precedence", async () => {
			const result = await evaluateDice("5-2+1==4");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ true ✅");
		});

		it("* / // share the same precedence", async () => {
			const result = await evaluateDice("5//2*2==4");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ true ✅");
		});

		it("throws error when not operand is not boolean", async () => {
			const result = await evaluateDice("!1");
			expectFailure(result);
			expect(result.description.getValue()).to.include("真偽値");
		});

		it("throws error when and/or operands are not boolean", async () => {
			const result = await evaluateDice("1&&2");
			expectFailure(result);
			expect(result.description.getValue()).to.include("真偽値と真偽値");
		});

		it("reports extra input errors", async () => {
			const result = await evaluateDice("1a");
			expectFailure(result);
			expect(result.description.getValue()).to.include("余計な入力");
		});

		it("supports chained comparisons", async () => {
			const result = await evaluateDice("1<2<3");
			expectSuccess(result);
			const lastLine = getLastLine(result);
			expect(lastLine === "✅" || lastLine.includes("→ true ✅")).to.equal(true);
		});

		it("combines not with comparisons", async () => {
			const result = await evaluateDice("!1<2");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ false ❌");
		});

		it("combines dice results with logic", async () => {
			const result = await evaluateDice("1d1>0&&!(2d1<2)");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ true ✅");
		});

		it("works with arrays, keep, and access", async () => {
			const result = await evaluateDice("3b1kh2[0]==1&&3b1kl1[0]==1");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ true ✅");
		});

		it("accepts not with parentheses and no space", async () => {
			const result = await evaluateDice("!(1==1)");
			expectSuccess(result);
			expect(getLastLine(result)).to.include("→ false ❌");
		});

		it("does not treat note as not keyword", async () => {
			const result = await evaluateDice("note");
			expectFailure(result);
			expect(result.description.getValue()).to.include("数値");
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
