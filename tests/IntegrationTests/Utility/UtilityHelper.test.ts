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
import { anything, instance, when, verify } from "ts-mockito";
import type { ChatInputCommandInteraction, BaseMessageOptions, APIEmbed } from "discord.js";

// ========================================
// Type Definitions
// ========================================

/**
 * Command options type for strongly-typed command parameters
 */
export type CommandOptions = Record<string, string | number | boolean | null | undefined>;

/**
 * Discord client type alias for better readability
 */
export type DiscordClient = Awaited<ReturnType<typeof TestDiscordServer.getClient>>;

/**
 * Embed data structure extracted from Discord API
 */
export type EmbedData = {
	title: string;
	description: string;
};

/**
 * Base handler context type
 */
export type HandlerContext = {
	commandMock: ChatInputCommandInteraction;
	client: DiscordClient;
};

/**
 * Handler context with reply capture
 */
export type HandlerContextWithReplyCapture = HandlerContext & {
	getReplyValue: () => string;
};

/**
 * Handler context with embed capture
 */
export type HandlerContextWithEmbedCapture = HandlerContext & {
	getEmbedReply: () => BaseMessageOptions | undefined;
};

/**
 * Initializes handler with mock command and client
 * @param commandName - The name of the command to mock
 * @param options - Optional parameters for the command
 * @returns Handler context with mock and client
 */
export const initializeHandler = async (
	commandName: string,
	options?: CommandOptions
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
export const initializeHandlerWithReplyCapture = async (
	commandName: string,
	options?: CommandOptions
): Promise<HandlerContextWithReplyCapture> => {
	const { commandMock, client } = await initializeHandler(commandName, options);
	let capturedValue = "";
	when(commandMock.reply(anything())).thenCall((args: string | BaseMessageOptions) => {
		capturedValue = typeof args === "string" ? args : "";
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
export const initializeHandlerWithEmbedCapture = async (
	commandName: string,
	options?: CommandOptions
): Promise<HandlerContextWithEmbedCapture> => {
	const { commandMock, client } = await initializeHandler(commandName, options);
	let capturedReply: BaseMessageOptions | undefined;
	when(commandMock.reply(anything())).thenCall((args: string | BaseMessageOptions) => {
		capturedReply = typeof args === "string" ? undefined : args;
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
export const executeHandler = async (
	client: DiscordClient,
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
export const executeCommandTest = async (
	commandName: string,
	options?: CommandOptions
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
export const executeCommandTestWithReplyCapture = async (
	commandName: string,
	options?: CommandOptions
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
export const executeCommandTestWithEmbedCapture = async (
	commandName: string,
	options?: CommandOptions
): Promise<HandlerContextWithEmbedCapture> => {
	const context = await initializeHandlerWithEmbedCapture(commandName, options);
	await executeHandler(context.client, context.commandMock);
	return context;
};

/**
 * Verifies that a command replied successfully without errors
 * @param commandMock - The mocked command to verify
 */
export const verifySuccessfulReply = (commandMock: ChatInputCommandInteraction): void => {
	verify(commandMock.reply(anything())).once();
	verify(commandMock.reply("")).never();
	verify(commandMock.reply(InternalErrorMessage)).never();
};

/**
 * Verifies that a command replied with an internal error
 * @param commandMock - The mocked command to verify
 */
export const verifyInternalErrorReply = (commandMock: ChatInputCommandInteraction): void => {
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
export const evaluateDice = async (source: string, showDetails = true): Promise<DiceResultDto> => {
	const logic = new DiceLogic();
	const ctx = new DiceContextDto(new DiceSource(source), new DiceIsSecret(false), new DiceShowDetails(showDetails));
	return logic.dice(ctx);
};

/**
 * Splits the result description into lines
 * @param result - The dice result DTO
 * @returns Array of description lines
 */
export const getDescriptionLines = (result: DiceResultDto): string[] => {
	return result.description.getValue().split("\n");
};

/**
 * Gets the last line of the result description
 * @param result - The dice result DTO
 * @returns The last line of the description
 */
export const getLastLine = (result: DiceResultDto): string => {
	const lines = getDescriptionLines(result);
	return lines[lines.length - 1] || "";
};

/**
 * Verifies that a dice result is successful
 * @param result - The dice result DTO
 */
export const expectDiceSuccess = (result: DiceResultDto): void => {
	expect(result.ok.getValue()).to.equal(true);
};

/**
 * Verifies that a dice result is a failure
 * @param result - The dice result DTO
 */
export const expectDiceFailure = (result: DiceResultDto): void => {
	expect(result.ok.getValue()).to.equal(false);
};

/**
 * Verifies that the result contains an error message
 * @param result - The dice result DTO
 * @param errorText - The expected error text
 */
export const expectDiceError = (result: DiceResultDto, errorText: string): void => {
	expectDiceFailure(result);
	expect(result.description.getValue()).to.include(errorText);
};

/**
 * Verifies that the last line matches the expected pattern
 * @param result - The dice result DTO
 * @param expectedPattern - The expected pattern in the last line
 */
export const expectLastLineIncludes = (result: DiceResultDto, expectedPattern: string): void => {
	expect(getLastLine(result)).to.include(expectedPattern);
};

/**
 * Verifies a successful boolean result
 * @param result - The dice result DTO
 * @param expectedValue - The expected boolean value (true or false)
 */
export const expectBooleanResult = (result: DiceResultDto, expectedValue: boolean): void => {
	expectDiceSuccess(result);
	const marker = expectedValue ? "✅" : "❌";
	const text = expectedValue ? "true" : "false";
	expectLastLineIncludes(result, `→ ${text} ${marker}`);
};

// ========================================
// Dice Command Helper Functions
// ========================================

/**
 * Extracts title and description from embed reply
 * @param options - The embed reply options
 * @returns Object containing title and description
 */
export const extractEmbedData = (options: BaseMessageOptions | undefined): EmbedData => {
	if (!options || !options.embeds || options.embeds.length === 0) {
		return { title: "", description: "" };
	}
	
	const embedObject = options.embeds[0];
	// Handle both EmbedBuilder and APIEmbed objects
	const embed = (embedObject as any).data ? (embedObject as any).data : (embedObject as APIEmbed);
	return {
		title: embed.title ?? "",
		description: embed.description ?? "",
	};
};

/**
 * Parses numeric value from embed description
 * @param description - The embed description
 * @returns Parsed numeric value or NaN
 */
export const parseEmbedValue = (description: string): number => {
	const match = description.match(/→\s*(-?\d+)/);
	return match ? Number(match[1]) : Number.NaN;
};

/**
 * Executes dice command and extracts embed data
 * @param source - The dice source expression
 * @param details - Whether to show details
 * @returns Object containing command mock and embed data
 */
export const executeDiceCommand = async (
	source: string,
	details = true
): Promise<{
	commandMock: ChatInputCommandInteraction;
	embedData: EmbedData;
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
export const verifyDiceRange = async (source: string, min: number, max: number): Promise<void> => {
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
export const verifyDiceExactValue = async (source: string, expectedValue: number): Promise<void> => {
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
export const verifyDiceError = async (source: string, expectedErrorText: string): Promise<void> => {
	const { commandMock, embedData } = await executeDiceCommand(source);
	verify(commandMock.reply(anything())).once();
	expect(embedData.title).to.include("エラー:");
	expect(embedData.description).to.include(expectedErrorText);
};
