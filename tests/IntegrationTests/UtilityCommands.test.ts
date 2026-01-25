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
import type { ChatInputCommandInteraction } from "discord.js";

// ========================================
// Handler Initialization Helper Functions
// ========================================

/**
 * Base handler context type
 */
type HandlerContext = {
	commandMock: ChatInputCommandInteraction;
	client: Awaited<ReturnType<typeof TestDiscordServer.getClient>>;
};

/**
 * Handler context with reply capture
 */
type HandlerContextWithReplyCapture = HandlerContext & {
	getReplyValue: () => string;
};

/**
 * Handler context with embed capture
 */
type HandlerContextWithEmbedCapture = HandlerContext & {
	getEmbedReply: () => any;
};

/**
 * Initializes handler with mock command and client
 * @param commandName - The name of the command to mock
 * @param options - Optional parameters for the command
 * @returns Handler context with mock and client
 */
const initializeHandler = async (
	commandName: string,
	options?: Record<string, any>
): Promise<HandlerContext> => {
	const commandMock = mockSlashCommand(commandName, options);
	const client = await TestDiscordServer.getClient();
	return { commandMock, client };
};

/**
 * Initializes handler with reply capture
 * @param commandName - The name of the command to mock
 * @param options - Optional parameters for the command
 * @returns Handler context with reply capture
 */
const initializeHandlerWithReplyCapture = async (
	commandName: string,
	options?: Record<string, any>
): Promise<HandlerContextWithReplyCapture> => {
	const { commandMock, client } = await initializeHandler(commandName, options);
	let capturedValue = "";
	when(commandMock.reply(anything())).thenCall((args) => {
		capturedValue = args;
	});

	return {
		commandMock,
		client,
		getReplyValue: () => capturedValue,
	};
};

/**
 * Initializes handler with embed reply capture
 * @param commandName - The name of the command to mock
 * @param options - Optional parameters for the command
 * @returns Handler context with embed capture
 */
const initializeHandlerWithEmbedCapture = async (
	commandName: string,
	options?: Record<string, any>
): Promise<HandlerContextWithEmbedCapture> => {
	const { commandMock, client } = await initializeHandler(commandName, options);
	let capturedReply: any;
	when(commandMock.reply(anything())).thenCall((args) => {
		capturedReply = args;
	});

	return {
		commandMock,
		client,
		getEmbedReply: () => capturedReply,
	};
};

/**
 * Executes a handler command and waits for reply
 * @param client - The Discord client
 * @param commandMock - The mocked command
 */
const executeHandler = async (
	client: Awaited<ReturnType<typeof TestDiscordServer.getClient>>,
	commandMock: ChatInputCommandInteraction
): Promise<void> => {
	client.emit("interactionCreate", instance(commandMock));
	await waitUntilReply(commandMock);
};

// ========================================
// Event Registration Test Helper Functions
// ========================================

/**
 * Executes handler and returns context
 * @param commandName - The name of the command to mock
 * @param options - Optional parameters for the command
 * @returns Handler context
 */
const executeCommandTest = async (
	commandName: string,
	options?: Record<string, any>
): Promise<HandlerContext> => {
	const context = await initializeHandler(commandName, options);
	await executeHandler(context.client, context.commandMock);
	return context;
};

/**
 * Executes handler with reply capture and returns context
 * @param commandName - The name of the command to mock
 * @param options - Optional parameters for the command
 * @returns Handler context with reply capture
 */
const executeCommandTestWithReplyCapture = async (
	commandName: string,
	options?: Record<string, any>
): Promise<HandlerContextWithReplyCapture> => {
	const context = await initializeHandlerWithReplyCapture(commandName, options);
	await executeHandler(context.client, context.commandMock);
	return context;
};

/**
 * Executes handler with embed capture and returns context
 * @param commandName - The name of the command to mock
 * @param options - Optional parameters for the command
 * @returns Handler context with embed capture
 */
const executeCommandTestWithEmbedCapture = async (
	commandName: string,
	options?: Record<string, any>
): Promise<HandlerContextWithEmbedCapture> => {
	const context = await initializeHandlerWithEmbedCapture(commandName, options);
	await executeHandler(context.client, context.commandMock);
	return context;
};

/**
 * Verifies that a command replied successfully without errors
 * @param commandMock - The mocked command to verify
 */
const verifySuccessfulReply = (commandMock: ChatInputCommandInteraction): void => {
	verify(commandMock.reply(anything())).once();
	verify(commandMock.reply("")).never();
	verify(commandMock.reply(InternalErrorMessage)).never();
};

/**
 * Verifies that a command replied with an internal error
 * @param commandMock - The mocked command to verify
 */
const verifyInternalErrorReply = (commandMock: ChatInputCommandInteraction): void => {
	verify(commandMock.reply(anything())).once();
	verify(commandMock.reply(InternalErrorMessage)).once();
};

// ========================================
// Dice Logic Helper Functions
// ========================================

/**
 * Evaluates a dice expression and returns the result
 * @param source - The dice expression source string
 * @param showDetails - Whether to show detailed results
 * @returns The dice result DTO
 */
const evaluateDice = async (source: string, showDetails = true): Promise<DiceResultDto> => {
	const logic = new DiceLogic();
	const ctx = new DiceContextDto(new DiceSource(source), new DiceIsSecret(false), new DiceShowDetails(showDetails));
	return logic.dice(ctx);
};

/**
 * Splits the result description into lines
 * @param result - The dice result DTO
 * @returns Array of description lines
 */
const getDescriptionLines = (result: DiceResultDto): string[] => {
	return result.description.getValue().split("\n");
};

/**
 * Gets the last line of the result description
 * @param result - The dice result DTO
 * @returns The last line of the description
 */
const getLastLine = (result: DiceResultDto): string => {
	const lines = getDescriptionLines(result);
	return lines[lines.length - 1] || "";
};

/**
 * Verifies that a dice result is successful
 * @param result - The dice result DTO
 */
const expectDiceSuccess = (result: DiceResultDto): void => {
	expect(result.ok.getValue()).to.equal(true);
};

/**
 * Verifies that a dice result is a failure
 * @param result - The dice result DTO
 */
const expectDiceFailure = (result: DiceResultDto): void => {
	expect(result.ok.getValue()).to.equal(false);
};

/**
 * Verifies that the result contains an error message
 * @param result - The dice result DTO
 * @param errorText - The expected error text
 */
const expectDiceError = (result: DiceResultDto, errorText: string): void => {
	expectDiceFailure(result);
	expect(result.description.getValue()).to.include(errorText);
};

/**
 * Verifies that the last line matches the expected pattern
 * @param result - The dice result DTO
 * @param expectedPattern - The expected pattern in the last line
 */
const expectLastLineIncludes = (result: DiceResultDto, expectedPattern: string): void => {
	expect(getLastLine(result)).to.include(expectedPattern);
};

/**
 * Verifies a successful boolean result
 * @param result - The dice result DTO
 * @param expectedValue - The expected boolean value (true or false)
 */
const expectBooleanResult = (result: DiceResultDto, expectedValue: boolean): void => {
	expectDiceSuccess(result);
	const marker = expectedValue ? "✅" : "❌";
	const text = expectedValue ? "true" : "false";
	expectLastLineIncludes(result, `→ ${text} ${marker}`);
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
			const { commandMock } = await executeCommandTest("help", {
				category: "all",
			});
			verifySuccessfulReply(commandMock);
		});

		/**
		 * [utilityカテゴリ表示] category:utilityカテゴリーでutility関連コマンドが表示される
		 * - レスポンスに「utilityカテゴリー」が含まれることを検証
		 * - レスポンスにutilityカテゴリのコマンド（/help, /waiwai, /parrot, /dice, /choice）が含まれることを検証
		 * - 内部エラーが発生しないことを検証
		 */
		it("Test /help category:utilityカテゴリー", async () => {
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("help", {
				category: "utilityカテゴリー",
			});
			verifySuccessfulReply(commandMock);
			
			const value = getReplyValue();
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
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("help", {
				category: "chatカテゴリー",
			});
			verifySuccessfulReply(commandMock);
			
			const value = getReplyValue();
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
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("help", {
				category: "reminderカテゴリー",
			});
			verifySuccessfulReply(commandMock);
			
			const value = getReplyValue();
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
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("help", {
				category: "candyカテゴリー",
			});
			verifySuccessfulReply(commandMock);
			
			const value = getReplyValue();
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
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("help", {
				category: "reviewカテゴリー",
			});
			verifySuccessfulReply(commandMock);
			
			const value = getReplyValue();
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
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("help", {
				category: "stickyカテゴリー",
			});
			verifySuccessfulReply(commandMock);
			
			const value = getReplyValue();
			expect(value).to.include("stickyカテゴリー");
			expect(value).to.include("/stickycreate");
			expect(value).to.include("/stickydelete");
		});

		/**
		 * [存在しないカテゴリ] category:invalidで空文字列が返される
		 * - 存在しないカテゴリを指定した場合に空文字列が返されることを検証
		 */
		it("Test /help category:invalid (non-existent category)", async () => {
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("help", {
				category: "invalid_category",
			});
			verify(commandMock.reply(anything())).once();
			expect(getReplyValue()).to.equal("");
		});

		/**
		 * [パラメータなし] category:nullで内部エラーが発生する
		 * - カテゴリが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /help category:null", async () => {
			const { commandMock } = await executeCommandTest("help");
			verifyInternalErrorReply(commandMock);
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
			const { commandMock } = await executeCommandTest("waiwai");
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
			const { commandMock } = await executeCommandTest("parrot", {
				message: message,
			});
			verify(commandMock.reply(message)).once();
		});

		/**
		 * [英語メッセージ] message:hello worldで入力メッセージがそのまま返される
		 * - 英語（スペース含む）の入力メッセージがそのまま返されることを検証
		 */
		it("Test /parrot message:hello world", async () => {
			const message = "hello world";
			const { commandMock } = await executeCommandTest("parrot", {
				message: message,
			});
			verify(commandMock.reply(message)).once();
		});

		/**
		 * [空文字列] message:空文字列で空文字列が返される
		 * - 空文字列を入力した場合に空文字列が返されることを検証
		 */
		it("Test /parrot message:empty string", async () => {
			const message = "";
			const { commandMock } = await executeCommandTest("parrot", {
				message: message,
			});
			verify(commandMock.reply(message)).once();
		});

		/**
		 * [パラメータなし] message:nullで内部エラーが発生する
		 * - メッセージが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /parrot message:null", async () => {
			const { commandMock } = await executeCommandTest("parrot");
			verifyInternalErrorReply(commandMock);
		});
	});

	/**
	 * DiceCommandHandlerのテスト
	 */
	describe("Test /dice command", () => {
		/**
		 * Extracts title and description from embed reply
		 * @param options - The embed reply options
		 * @returns Object containing title and description
		 */
		const extractEmbedData = (options: any): { title: string; description: string } => {
			const embed = options?.embeds?.[0];
			const data = embed?.data ?? embed;
			return {
				title: data?.title ?? "",
				description: data?.description ?? "",
			};
		};

		/**
		 * Parses numeric value from embed description
		 * @param description - The embed description
		 * @returns Parsed numeric value or NaN
		 */
		const parseEmbedValue = (description: string): number => {
			const match = description.match(/→\s*(-?\d+)/);
			return match ? Number(match[1]) : Number.NaN;
		};

		/**
		 * Executes dice command and extracts embed data
		 * @param source - The dice source expression
		 * @param details - Whether to show details
		 * @returns Object containing command mock and embed data
		 */
		const executeDiceCommand = async (
			source: string,
			details = true
		): Promise<{
			commandMock: ChatInputCommandInteraction;
			embedData: { title: string; description: string };
		}> => {
			const { commandMock, getEmbedReply } = await executeCommandTestWithEmbedCapture("dice", {
				source,
				details,
			});
			const embedData = extractEmbedData(getEmbedReply());
			return { commandMock, embedData };
		};

		/**
		 * Verifies that dice command returned a valid numeric result within range
		 * @param source - The dice source expression
		 * @param min - Minimum expected value
		 * @param max - Maximum expected value
		 */
		const verifyDiceRange = async (source: string, min: number, max: number): Promise<void> => {
			const { commandMock, embedData } = await executeDiceCommand(source);
			verify(commandMock.reply(anything())).once();
			const value = parseEmbedValue(embedData.description);
			expect(value).to.be.within(min, max);
		};

		/**
		 * Verifies that dice command returned an exact value
		 * @param source - The dice source expression
		 * @param expectedValue - The expected exact value
		 */
		const verifyDiceExactValue = async (source: string, expectedValue: number): Promise<void> => {
			const { commandMock, embedData } = await executeDiceCommand(source);
			verify(commandMock.reply(anything())).once();
			const value = parseEmbedValue(embedData.description);
			expect(value).to.equal(expectedValue);
		};

		/**
		 * Verifies that dice command returned an error
		 * @param source - The dice source expression
		 * @param expectedErrorText - The expected error text in the description
		 */
		const verifyDiceError = async (source: string, expectedErrorText: string): Promise<void> => {
			const { commandMock, embedData } = await executeDiceCommand(source);
			verify(commandMock.reply(anything())).once();
			expect(embedData.title).to.include("エラー:");
			expect(embedData.description).to.include(expectedErrorText);
		};

		/**
		 * [ランダム値] source:1d100で1〜100の範囲で返される
		 */
		it("Test /dice source:1d100", async () => {
			await verifyDiceRange("1d100", 1, 100);
		});

		/**
		 * [最小値] source:1d1で常に1を返す
		 */
		it("Test /dice source:1d1 (minimum value)", async () => {
			await verifyDiceExactValue("1d1", 1);
		});

		/**
		 * [標準ダイス] source:1d6で1〜6の範囲で返される
		 */
		it("Test /dice source:1d6 (standard dice)", async () => {
			await verifyDiceRange("1d6", 1, 6);
		});

		/**
		 * [必須パラメータなし] source:nullで内部エラーが発生する
		 */
		it("Test /dice source:null", async () => {
			const { commandMock } = await executeCommandTest("dice", {
				source: null,
			});
			verifyInternalErrorReply(commandMock);
		});

		/**
		 * [構文エラー] source:1.5でパースエラーが返される
		 */
		it("Test /dice source:1.5 (invalid source)", async () => {
			await verifyDiceError("1.5", "入力に誤り");
		});
	});

	/**
	 * DiceLogic式評価のテスト
	 */
	describe("DiceLogic expression tests", () => {
		it("not binds tighter than and/or", async () => {
			const result = await evaluateDice("!1==1&&1==1");
			expectBooleanResult(result, false);
		});

		it("supports multiple not operators", async () => {
			const result = await evaluateDice("!!1==1");
			expectBooleanResult(result, true);
		});

		it("and/or are left-associative with same precedence", async () => {
			const result = await evaluateDice("1==1||1==2&&1==2");
			expectBooleanResult(result, false);
		});

		it("respects arithmetic precedence", async () => {
			const result = await evaluateDice("1+2*3==7");
			expectBooleanResult(result, true);
		});

		it("parentheses override precedence", async () => {
			const result = await evaluateDice("(1+2)*3==9");
			expectBooleanResult(result, true);
		});

		it("+ and - share the same precedence", async () => {
			const result = await evaluateDice("5-2+1==4");
			expectBooleanResult(result, true);
		});

		it("* / // share the same precedence", async () => {
			const result = await evaluateDice("5//2*2==4");
			expectBooleanResult(result, true);
		});

		it("throws error when not operand is not boolean", async () => {
			const result = await evaluateDice("!1");
			expectDiceError(result, "真偽値");
		});

		it("throws error when and/or operands are not boolean", async () => {
			const result = await evaluateDice("1&&2");
			expectDiceError(result, "真偽値と真偽値");
		});

		it("reports extra input errors", async () => {
			const result = await evaluateDice("1a");
			expectDiceError(result, "余計な入力");
		});

		it("supports chained comparisons", async () => {
			const result = await evaluateDice("1<2<3");
			expectDiceSuccess(result);
			const lastLine = getLastLine(result);
			expect(lastLine === "✅" || lastLine.includes("→ true ✅")).to.equal(true);
		});

		it("combines not with comparisons", async () => {
			const result = await evaluateDice("!1<2");
			expectBooleanResult(result, false);
		});

		it("combines dice results with logic", async () => {
			const result = await evaluateDice("1d1>0&&!(2d1<2)");
			expectBooleanResult(result, true);
		});

		it("works with arrays, keep, and access", async () => {
			const result = await evaluateDice("3b1kh2[0]==1&&3b1kl1[0]==1");
			expectBooleanResult(result, true);
		});

		it("accepts not with parentheses and no space", async () => {
			const result = await evaluateDice("!(1==1)");
			expectBooleanResult(result, false);
		});

		it("does not treat note as not keyword", async () => {
			const result = await evaluateDice("note");
			expectDiceError(result, "数値");
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
				const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("choice", {
					items: choices.join(" "),
				});

				verify(commandMock.reply(anything())).once();
				const value = getReplyValue();
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
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("choice", {
				items: "only_one",
			});

			verify(commandMock.reply(anything())).once();
			expect(getReplyValue()).to.equal("only_one");
		});

		/**
		 * [2つの選択肢] parameter:two itemsで2つの選択肢からランダムに選ばれる
		 * - 選択結果がappleまたはorangeのいずれかであることを検証
		 */
		it("Test /choice parameter:two items", async () => {
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("choice", {
				items: "apple orange",
			});

			verify(commandMock.reply(anything())).once();
			expect(["apple", "orange"]).to.include(getReplyValue());
		});

		/**
		 * [英語選択肢] parameter:english wordsで英語の選択肢からランダムに選ばれる
		 * - 選択結果がapple、banana、cherryのいずれかであることを検証
		 */
		it("Test /choice parameter:english words", async () => {
			const choices = ["apple", "banana", "cherry"];
			const { commandMock, getReplyValue } = await executeCommandTestWithReplyCapture("choice", {
				items: choices.join(" "),
			});

			verify(commandMock.reply(anything())).once();
			expect(choices).to.include(getReplyValue());
		});

		/**
		 * [パラメータなし] parameter:nullで内部エラーが発生する
		 * - パラメータが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /choice parameter:null", async () => {
			const { commandMock } = await executeCommandTest("choice");
			verifyInternalErrorReply(commandMock);
		});
	});
});
