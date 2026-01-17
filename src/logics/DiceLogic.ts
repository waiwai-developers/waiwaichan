import { injectable } from "inversify";
import type { DiceContextDto } from "@/src/entities/dto/DiceContextDto";
import { DiceResultDto } from "@/src/entities/dto/DiceResultDto";
import { DiceResultDescription } from "@/src/entities/vo/DiceResultDescription";
import { DiceResultOk } from "@/src/entities/vo/DiceResultOk";
import { DiceResultTitle } from "@/src/entities/vo/DiceResultTitle";
import type { IDiceLogic } from "@/src/logics/Interfaces/logics/IDiceLogic";

@injectable()
export class DiceLogic implements IDiceLogic {
	async dice(ctx: DiceContextDto): Promise<DiceResultDto> {
		const result = new Interpreter().interpret(ctx.source.getValue());
		const source = ctx.source.getValue();

		if (result.ok) {
			const filteredHistory = result.history.filter((s) => !/^\d+$/.test(s));
			const lastOrValue = (arr: string[]): string => {
				return arr.length ? arr[arr.length - 1] : `いる${result.value}`;
			};
			return new DiceResultDto(
				new DiceResultOk(true),
				new DiceResultTitle(source),
				new DiceResultDescription(
					ctx.showDetails.getValue()
						? filteredHistory.join("\n")
						: lastOrValue(filteredHistory),
				),
			);
		}
		return new DiceResultDto(
			new DiceResultOk(false),
			new DiceResultTitle(`エラー: ${source}`),
			new DiceResultDescription(result.error),
		);
	}
}

// ==== Ast ===========================
type Span = {
	line: number;
	column: number;
	length: number;
};

type LocatedInput = {
	text: string;
	span: Span;
};

function locatedInput(text: string): LocatedInput {
	return {
		text,
		span: { line: 1, column: 1, length: text.replace(/\s+/g, "").length },
	};
}

interface BinaryOp {
	lhs: Expr;
	rhs: Expr;
	span: Span;
}

type ArithmeticOp = "+" | "-" | "*" | "//" | "/";
type KeepOp = "kh" | "kl";
type CompareOp = "!=" | "=" | ">=" | "<=" | ">" | "<";
type LogicalOp = "and" | "or";

type Expr =
	| { type: "Integer"; value: number; span: Span } // 定数
	| ({ type: "StandardRoll"; threshold?: Expr } & BinaryOp) // 通常ダイス
	| ({ type: "SpreadRoll" } & BinaryOp) // ダイスの一覧
	| ({ type: "Keep"; op: KeepOp } & BinaryOp) // 配列からn個取り出す
	| { type: "Access"; expr: Expr; index: Expr; span: Span } // 配列アクセス
	| ({ type: "Arithmetic"; op: ArithmeticOp } & BinaryOp) // 算術演算
	| ({ type: "Compare"; op: CompareOp } & BinaryOp) // 比較演算
	| { type: "LogicalNot"; expr: Expr; span: Span } // 論理否定
	| ({ type: "Logical"; op: LogicalOp } & BinaryOp); // 論理演算

// ==== Value =========================
type Value = number | number[] | boolean;

function isBoolean(value: Value): value is boolean {
	return typeof value === "boolean";
}

function isNumber(value: Value): value is number {
	return typeof value === "number";
}

function isNaturalNumber(value: Value): value is number {
	return (
		isNumber(value) && (value as number) % 1 === 0 && (value as number) >= 0
	);
}

function isArray(value: Value): value is number[] {
	return typeof value === "object" && value != null;
}

// ==== Error =========================
type DiceError = {
	span: Span;
	expected: string;
	found: string;
	errorPointer: string;
	fatal?: boolean; // 回復不能なエラーか
};

type ParseResult<T> =
	| { ok: true; value: T; remaining: LocatedInput }
	| { ok: false; error: DiceError };

type InterpretOk = {
	ok: true;
	value: Value;
	span: Span;
	formatedData: string;
};

type InterpretResult = InterpretOk | { ok: false; error: DiceError };

type ExecuteResult =
	| { ok: true; value: Value; history: string[] }
	| { ok: false; error: string };

function createParseError(input: LocatedInput, expected: string): DiceError {
	const pointerLine = `${" ".repeat(input.span.column - 1) +
		"^".repeat(Math.max(1, input.span.length))
		}🤔`;
	return {
		span: input.span,
		expected,
		found: input.text.charAt(0) || "EOF",
		errorPointer: pointerLine,
	};
}

function createInterpretError(
	expr: Extract<InterpretResult, { ok: true }>,
	span: Span,
	expected: string,
): DiceError {
	const pointerLine = `${" ".repeat(expr.span.column - 1) + "^".repeat(span.length)}🤔`;
	return {
		span: expr.span,
		expected,
		found: `${expr.formatedData}`,
		errorPointer: pointerLine,
	};
}

function formatError(error: DiceError, original: string): string {
	const expected = [...new Set(error.expected.split(ALT_TEXT))].join(ALT_TEXT);
	const found = error.found.trim().length === 0 ? "<空>" : `${error.found}`;
	return `入力に誤りがあるよ！[${error.span.line}行 ${error.span.column}番目]

期待するもの: ${expected}
見つかったもの: ${found}

\`\`\`txt
${extractLine(original, error.span.line)}
${error.errorPointer}
\`\`\`
`;
}

function extractLine(text: string, line: number): string {
	return text.split("\n")[line - 1] || "";
}

// ==== Mynom =========================
/** rust::nomを参考にしたパーサ */

type Parser<T> = (input: LocatedInput) => ParseResult<T>;

// alt関数のエラー文の区切り文字
const ALT_TEXT = " または ";

/**
 * 入力位置情報を更新する
 * @param input
 * @param consumed
 * @returns remaining
 */
function updatePos(input: LocatedInput, consumed: string): LocatedInput {
	if (!consumed) return input;

	let line = input.span.line;
	let column = input.span.column;

	for (const ch of consumed) {
		if (ch === "\n") {
			line++;
			column = 1;
		} else {
			column++;
		}
	}
	input.span.length = consumed.length;
	return {
		text: input.text.slice(consumed.length),
		span: {
			line: line,
			column: column,
			length: consumed.length,
		},
	};
}

/**
 * 空白文字(スペース・タブ・改行)を認識する
 * 空白が無くても成功するオプショナルパーサ
 */
function whitespace(): Parser<string> {
	return (input) => {
		const whitespace = input.text.match(/^[\s\n]+/);
		if (whitespace) {
			const matched = whitespace[0];
			return {
				ok: true,
				value: matched,
				remaining: updatePos(input, matched),
			};
		}
		return {
			ok: true,
			value: "",
			remaining: input,
		};
	};
}

/** 整数リテラルを認識する */
const integer: Parser<number> = (input) => {
	const match = input.text.match(/^\d+/);
	if (!match)
		return {
			ok: false,
			error: createParseError(input, "数値{例: 1}"),
		};
	return {
		ok: true,
		value: Number.parseInt(match[0], 10),
		remaining: updatePos(input, match[0]),
	};
};

/** 特定の文字列を認識する */
function tag(token: string): Parser<string> {
	return (input) => {
		if (input.text.startsWith(token)) {
			return { ok: true, value: token, remaining: updatePos(input, token) };
		}
		// "("の場合はエラー文を分かりやすくする
		const expected = token === "(" ? "括弧付き式{例: (1d6 + 3)}" : `'${token}'`;
		return {
			ok: false,
			error: createParseError(input, expected),
		};
	};
}

/** パーサのリストを１つずつテストし成功するまで繰り返す */
function alt<T>(...parsers: Parser<T>[]): Parser<T> {
	return (input) => {
		const errors: string[] = [];
		for (const parser of parsers) {
			const result = parser(input);
			if (result.ok) return result;
			if (result.error.fatal) {
				return result;
			}
			errors.push(result.error.expected);
		}
		return {
			ok: false,
			error: createParseError(input, errors.join(ALT_TEXT)),
		};
	};
}

/** パーサを前後のパーサで囲み、中央のパーサの結果を取得する */
function delimited<F, G, H>(
	prefixParser: Parser<F>,
	parser: Parser<G>,
	postfixParser: Parser<H>,
): Parser<G> {
	return (input) => {
		const prefixResult = prefixParser(input);
		if (!prefixResult.ok) return prefixResult;
		const reuslt = parser(prefixResult.remaining);
		if (!reuslt.ok) return reuslt;
		const postfixResult = postfixParser(reuslt.remaining);
		if (!postfixResult.ok) return cut(postfixResult);
		// 全体で消費したテキスト
		const totalConsumed = input.text.slice(
			0,
			input.text.length - postfixResult.remaining.text.length,
		);
		return {
			ok: true,
			value: reuslt.value,
			remaining: updatePos(input, totalConsumed),
		};
	};
}

/** ２つのパーサを順に適用し、それぞれの結果を配列で返す */
function pair<F, G>(first: Parser<F>, second: Parser<G>): Parser<[F, G]> {
	return (input) => {
		const firstResult = first(input);
		if (!firstResult.ok)
			return {
				ok: false,
				error: firstResult.error,
			};
		const secondResult = second(firstResult.remaining);
		if (!secondResult.ok)
			return cut({
				ok: false,
				error: secondResult.error,
			});
		return {
			ok: true,
			value: [firstResult.value, secondResult.value],
			remaining: secondResult.remaining,
		};
	};
}

/** 0回以上の繰り返しに対応したfold処理 */
function foldMany0<F, H>(
	parser: Parser<F>,
	init: H,
	g: (acc: H, item: F) => H,
): Parser<H> {
	return (input) => {
		let acc = init;
		let remaining = input;
		while (true) {
			const result = parser(remaining);
			if (!result.ok) {
				if (result.error.fatal) {
					return result;
				}
				break;
			}
			acc = g(acc, result.value);
			// 無限ループ防止
			if (result.remaining === remaining) break;
			remaining = result.remaining;
		}
		return { ok: true, value: acc, remaining };
	};
}

/** 1回だけ認識を試みるfold */
function foldOnce<F, H>(
	parser: Parser<F>,
	init: H,
	g: (acc: H, item: F) => H,
): Parser<H> {
	return (input) => {
		let acc = init;
		let remaining = input;
		// 一回だけ試行
		const result = parser(remaining);
		if (!result.ok) {
			if (!result.error.fatal) {
				return { ok: true, value: acc, remaining };
			}
			return result;
		}
		acc = g(acc, result.value);
		remaining = result.remaining;
		return { ok: true, value: acc, remaining };
	};
}

/** エラー発生時のexpectedの情報を付与する */
function withErrorContext<T>(parser: Parser<T>, context: string): Parser<T> {
	return (input) => {
		const result = parser(input);
		if (!result.ok) {
			return {
				ok: false,
				error: {
					...result.error,
					expected: context,
				},
			};
		}
		return result;
	};
}

/** 失敗した結果に回復不能を付与する */
function cut<T, E extends DiceError>(result: {
	ok: false;
	error: E;
}): ParseResult<T> {
	result.error.fatal = true;
	return result;
}

// ==== Parser ========================

function spaceDelimited<T>(parser: Parser<T>): Parser<T> {
	return (input) => {
		const result = delimited(whitespace(), parser, whitespace())(input);
		if (!result.ok) return result;
		return result;
	};
}

/** 二項演算子 */
function binary(
	operandParser: Parser<Expr>,
	opParser: Parser<string>,
	resultType: string,
	valErrorContext: string,
): Parser<Expr> {
	return (input) => {
		const r0 = operandParser(input);
		if (!r0.ok) return r0;

		return foldMany0<[string, Expr], Expr>(
			(input): ParseResult<[string, Expr]> => {
				const result = pair(
					opParser,
					withErrorContext(operandParser, valErrorContext),
				)(input);
				if (!result.ok) return result;
				const [op, val] = result.value;
				return {
					ok: true,
					value: [op, val],
					remaining: result.remaining,
				};
			},
			r0.value,
			(acc, [currentOp, val]) => {
				const span = {
					line: acc.span.line,
					column: acc.span.column,
					length: acc.span.length + currentOp.length + val.span.length,
				};
				return {
					type: resultType,
					op: currentOp,
					lhs: acc,
					rhs: val,
					span,
				} as Expr;
			},
		)(r0.remaining);
	};
}

const integerExpr: Parser<Expr> = (input) => {
	const result = spaceDelimited(integer)(input);
	if (!result.ok) return result;

	return {
		ok: true,
		value: { type: "Integer", value: result.value, span: input.span },
		remaining: result.remaining,
	};
};

const paren: Parser<Expr> = (input) => {
	const exprResult = delimited(
		spaceDelimited(tag("(")),
		expr,
		spaceDelimited(tag(")")),
	)(input);
	if (!exprResult.ok) return exprResult;
	return exprResult;
};

const primary: Parser<Expr> = (input) => {
	return alt(paren, integerExpr)(input);
};

const standardRoll: Parser<Expr> = (input) => {
	const r0 = primary(input);
	if (!r0.ok) return r0;

	return foldMany0<{ dice: [string, Expr]; crit?: [string, Expr] }, Expr>(
		(input): ParseResult<{ dice: [string, Expr]; crit?: [string, Expr] }> => {
			const diceResult = pair(
				alt(tag("d"), tag("D")),
				withErrorContext(primary, "ダイスの面"),
			)(input);
			if (!diceResult.ok) return diceResult;
			let remaining = diceResult.remaining;

			// クリティカルがある？
			let crit: [string, Expr] | undefined = undefined;
			const critResult = pair(
				alt(tag("critical"), tag("crit"), tag("c"), tag("C")),
				withErrorContext(
					alt(standardRoll, primary),
					"クリティカル、ファンブルの閾値(数値)",
				),
			)(remaining);
			if (critResult.ok) {
				crit = critResult.value;
				remaining = critResult.remaining;
			}
			return {
				ok: true,
				value: { dice: diceResult.value, crit },
				remaining,
			};
		},
		r0.value,
		(acc, { dice, crit }) => {
			const span = {
				line: acc.span.line,
				column: acc.span.line,
				length:
					acc.span.length +
					dice[0].length +
					dice[1].span.length +
					(crit?.[0].length || 0) +
					(crit?.[1].span.length || 0),
			};
			return {
				type: "StandardRoll",
				lhs: acc,
				rhs: dice[1],
				threshold: crit?.[1],
				span,
			};
		},
	)(r0.remaining);
};

const spreadRoll: Parser<Expr> = binary(
	standardRoll,
	alt(tag("b"), tag("B")),
	"SpreadRoll",
	"ダイスの面(数値)"
);

const keep: Parser<Expr> = binary(
	spreadRoll,
	alt(tag("kh"), tag("kl")),
	"Keep",
	"Keepする数",
);

const access: Parser<Expr> = (input) => {
	const exprResult = keep(input);
	if (!exprResult.ok) return exprResult;
	return foldOnce(
		delimited(
			spaceDelimited(tag("[")),
			withErrorContext(expr, "インデックス(数値)"),
			spaceDelimited(tag("]")),
		),
		exprResult.value,
		(acc, index) => {
			const span = {
				line: acc.span.line,
				column: acc.span.column,
				length: acc.span.length + index.span.length,
			};
			index.span.column = acc.span.column + acc.span.length + 1;
			return {
				ok: true,
				type: "Access",
				expr: acc,
				index,
				span,
			} as Expr;
		},
	)(exprResult.remaining);
};

const multiplicative: Parser<Expr> = binary(
	access,
	alt(tag("*"), tag("//"), tag("/")),
	"Arithmetic",
	"右側の項",
);

const additive: Parser<Expr> = binary(
	multiplicative,
	alt(tag("+"), tag("-")),
	"Arithmetic",
	"右側の項",
);

const compare: Parser<Expr> = binary(
	additive,
	alt(tag("!="), tag("="), tag("<="), tag(">="), tag("<"), tag(">")),
	"Compare",
	"比較する項",
);

const logicalNot: Parser<Expr> = (input) => {
	const notResult = pair(
		spaceDelimited(tag("not")),
		withErrorContext(logicalNot, "比較する項"),
	)(input);
	if (notResult.ok) {
		const remaining = notResult.remaining;
		const totalConsumed = input.text.slice(
			0,
			input.text.length - remaining.text.length,
		);
		return {
			ok: true,
			value: {
				type: "LogicalNot",
				expr: notResult.value[1],
				span: {
					line: input.span.line,
					column: input.span.column,
					length: totalConsumed.length,
				},
			},
			remaining,
		};
	}
	return compare(input);
};

const logicalAnd: Parser<Expr> = binary(
	logicalNot,
	tag("and"),
	"Logical",
	"比較する項",
);

const logicalOr: Parser<Expr> = binary(
	logicalAnd,
	tag("or"),
	"Logical",
	"比較する項",
);

const expr: Parser<Expr> = (input) => {
	return logicalOr(input);
};

const parseProgram: Parser<Expr> = (input) => {
	const result = expr(input);
	if (!result.ok) return result;
	// remainingが残っていたらエラー
	const remaining = spaceDelimited(whitespace())(result.remaining);
	if (remaining.ok && remaining.remaining.text !== "") {
		return {
			ok: false,
			error: createParseError(result.remaining, "<余計な入力があります>"),
		};
	}
	// 正常
	return result;
};

// ==== Interpreter ===================
class Interpreter {
	// 評価の履歴
	private history: InterpretOk[];

	constructor() {
		this.history = [];
	}

	// 与えられたソースコードを解析して結果を返す
	public interpret(source: string): ExecuteResult {
		const expr = parseProgram(locatedInput(source));
		if (!expr.ok) {
			return { ok: false, error: formatError(expr.error, source) };
		}
		this.history = [];
		const result = this.evalExpr(expr.value);
		if (!result.ok) {
			return { ok: false, error: formatError(result.error, source) };
		}
		return {
			ok: true,
			history: this.history.map((x) => x.formatedData),
			value: result.value,
		};
	}

	private addHistory(value: InterpretOk): InterpretResult {
		this.history.push(value);
		return value;
	}

	private evalExpr(expr: Expr): InterpretResult {
		switch (expr.type) {
			case "Integer": {
				return this.addHistory({
					ok: true,
					value: expr.value,
					span: expr.span,
					formatedData: `${expr.value}`,
				});
			}
			case "StandardRoll": {
				const count = validateNaturalNumber(this.evalExpr(expr.lhs));
				if (!count.ok) return count;
				const sides = validateNaturalNumber(this.evalExpr(expr.rhs));
				if (!sides.ok) return sides;
				const value = [...Array(count.value)]
					.map((_) => random(sides.value as number))
					.reduce((acc, x) => {
						return acc + x;
					}, 0);
				// クリティカル判定
				let crit = "";
				if (expr.threshold) {
					const threshold = validateNaturalNumber(
						this.evalExpr(expr.threshold),
					);
					if (!threshold.ok) return threshold;
					crit =
						(value as number) <= (threshold.value as number)
							? "🎯"
							: (value as number) >=
								(sides.value as number) - (threshold.value as number)
								? "💀"
								: "";
				}
				return this.addHistory({
					ok: true,
					value,
					span: expr.span,
					formatedData: `${count.value}d${sides.value} → ${value}${crit}`,
				});
			}
			case "SpreadRoll": {
				const count = validateNaturalNumber(this.evalExpr(expr.lhs));
				if (!count.ok) return count;
				const sides = validateNaturalNumber(this.evalExpr(expr.rhs));
				if (!sides.ok) return sides;
				const value = [...Array(count.value)].map((_) =>
					random(sides.value as number),
				);
				return this.addHistory({
					ok: true,
					value,
					span: expr.span,
					formatedData: `${count.value}b${sides.value} → [${value}]`,
				});
			}
			case "Keep": {
				const lhs = validateArray(this.evalExpr(expr.lhs));
				if (!lhs.ok) return lhs;
				lhs.value = lhs.value as number[];
				const rhs = validateNaturalNumber(this.evalExpr(expr.rhs));
				if (!rhs.ok) return rhs;
				rhs.value = rhs.value as number;
				if (rhs.value > lhs.value.length || rhs.value < 0) {
					return {
						ok: false,
						error: createInterpretError(
							rhs,
							rhs.span,
							`0 <= idx <= ${lhs.value.length}`,
						),
					};
				}
				const compare =
					expr.op === "kh"
						? (a: number, b: number) => b - a
						: (a: number, b: number) => a - b;
				const value = lhs.value.slice().sort(compare).slice(0, rhs.value);
				return this.addHistory({
					ok: true,
					value,
					span: expr.span,
					formatedData: `[${lhs.value}]${expr.op}${rhs.value} → [${value}]`,
				});
			}
			case "Access": {
				const data = validateArray(this.evalExpr(expr.expr));
				if (!data.ok) return data;
				data.value = data.value as number[];
				const index = validateNaturalNumber(this.evalExpr(expr.index));
				if (!index.ok) return index;
				index.value = index.value as number;
				if (index.value >= data.value.length || index.value < 0) {
					return {
						ok: false,
						error: createInterpretError(
							index,
							index.span,
							`0 <= idx < ${data.value.length}`,
						),
					};
				}
				const value = data.value[index.value];
				return this.addHistory({
					ok: true,
					value,
					span: expr.span,
					formatedData: `[${data.value}][${index.value}] → ${value}`,
				});
			}
			case "Arithmetic": {
				const lhs = this.evalExpr(expr.lhs);
				if (!lhs.ok) return lhs;
				const rhs = this.evalExpr(expr.rhs);
				if (!rhs.ok) return rhs;
				const arithmeticOps = {
					"+": (a: number, b: number) => a + b,
					"-": (a: number, b: number) => a - b,
					"*": (a: number, b: number) => a * b,
					"//": (a: number, b: number) => Math.floor(a / b),
					"/": (a: number, b: number) => a / b,
				};
				const calc = arithmeticOps[expr.op];
				let err = lhs;
				if (isArray(lhs.value)) {
					if (isArray(rhs.value) && expr.op === "+") {
						// リストの連結
						const value = lhs.value.concat(rhs.value);
						return this.addHistory({
							ok: true,
							value,
							span: expr.span,
							formatedData: `[${lhs.value}] ${expr.op} [${rhs.value}] → [${value}]`,
						});
					}
					if (isNumber(rhs.value)) {
						// スカラー演算
						const value = lhs.value.map((x) => calc(x, rhs.value as number));
						return this.addHistory({
							ok: true,
							value,
							span: expr.span,
							formatedData: `[${lhs.value}] ${expr.op} ${rhs.value} → [${value}]`,
						});
					}
					err = rhs;
				} else if (isNumber(lhs.value)) {
					if (isNumber(rhs.value)) {
						// 数値の演算
						const value = calc(lhs.value as number, rhs.value as number);
						return this.addHistory({
							ok: true,
							value,
							span: expr.span,
							formatedData: `${lhs.value} ${expr.op} ${rhs.value} → ${value}`,
						});
					}
					err = rhs;
				}
				return {
					ok: false,
					error: createInterpretError(
						err,
						err.span,
						"数値と数値 または リストとリスト または リストと数値",
					),
				};
			}
			case "Compare": {
				// a < b < c -> a < b and b < cに変換する
				if (expr.lhs.type === "Compare") {
					const lhs = expr.lhs;
					expr.lhs = {
						type: "Logical",
						op: "and",
						lhs: {
							type: "Compare",
							op: lhs.op,
							lhs: lhs.lhs,
							rhs: lhs.rhs,
							span: lhs.span,
						},
						rhs: {
							type: "Compare",
							op: expr.op,
							lhs: lhs.rhs,
							rhs: expr.rhs,
							span: lhs.span,
						},
						span: expr.lhs.span,
					};
					return this.evalExpr(expr);
				}
				const lhs = this.evalExpr(expr.lhs);
				if (!lhs.ok) return lhs;
				const rhs = this.evalExpr(expr.rhs);
				if (!rhs.ok) return rhs;
				if (isBoolean(lhs.value)) {
					return this.addHistory({
						ok: true,
						value: lhs.value,
						span: expr.span,
						formatedData: `${lhs.value ? "✅" : "❌"}`,
					});
				}
				const compareOps = {
					"!=": (a: number, b: number) => a !== b,
					"=": (a: number, b: number) => a === b,
					"<": (a: number, b: number) => a < b,
					"<=": (a: number, b: number) => a <= b,
					">": (a: number, b: number) => a > b,
					">=": (a: number, b: number) => a >= b,
				};
				const compare = compareOps[expr.op];
				// 配列フィルタリング
				if (isArray(lhs.value) && isNumber(rhs.value)) {
					const filteredList = lhs.value.filter((x) =>
						compare(x, rhs.value as number),
					);
					return this.addHistory({
						ok: true,
						value: filteredList,
						span: expr.span,
						formatedData: `[${lhs.value}] ${expr.op} ${rhs.value} → [${filteredList}]`,
					});
				}
				// 通常比較
				if (!isNumber(lhs.value)) {
					return {
						ok: false,
						error: createInterpretError(
							lhs,
							lhs.span,
							"数値と数値 または リストと数値(フィルタ)",
						),
					};
				}
				if (!isNumber(rhs.value)) {
					return {
						ok: false,
						error: createInterpretError(
							rhs,
							rhs.span,
							"数値と数値 または リストと数値(フィルタ)",
						),
					};
				}
				const value = compare(lhs.value, rhs.value);
				return this.addHistory({
					ok: true,
					value,
					span: expr.span,
					formatedData: `${lhs.value} ${expr.op} ${rhs.value} → ${value ? "✅" : "❌"}`,
				});
			}
			case "LogicalNot": {
				const value = this.evalExpr(expr.expr);
				if (!value.ok) return value;
				if (!isBoolean(value.value)) {
					return {
						ok: false,
						error: createInterpretError(value, value.span, "真偽値"),
					};
				}
				const resultValue = !value.value;
				return this.addHistory({
					ok: true,
					value: resultValue,
					span: expr.span,
					formatedData: `not ${value.value} → ${resultValue ? "✅" : "❌"}`,
				});
			}
			case "Logical": {
				const lhs = this.evalExpr(expr.lhs);
				if (!lhs.ok) return lhs;
				const rhs = this.evalExpr(expr.rhs);
				if (!rhs.ok) return rhs;
				if (!isBoolean(lhs.value)) {
					return {
						ok: false,
						error: createInterpretError(lhs, lhs.span, "真偽値と真偽値"),
					};
				}
				if (!isBoolean(rhs.value)) {
					return {
						ok: false,
						error: createInterpretError(rhs, rhs.span, "真偽値と真偽値"),
					};
				}
				const resultValue =
					expr.op === "and" ? lhs.value && rhs.value : lhs.value || rhs.value;
				return this.addHistory({
					ok: true,
					value: resultValue,
					span: expr.span,
					formatedData: `${lhs.value} ${expr.op} ${rhs.value} → ${resultValue ? "✅" : "❌"}`,
				});
			}
		}
	}
}

/** ダイスのランダム値生成(1～limit) */
function random(limit: number): number {
	return limit === 0 ? 0 : Math.floor(Math.random() * limit) + 1;
}

/** 評価結果が自然数か検証する */
function validateNaturalNumber(result: InterpretResult): InterpretResult {
	if (!result.ok) return result;
	if (!isNaturalNumber(result.value)) {
		return {
			ok: false,
			error: createInterpretError(result, result.span, "自然数"),
		};
	}
	return result;
}

/** 評価結果がリストか検証する */
function validateArray(result: InterpretResult): InterpretResult {
	if (!result.ok) return result;
	if (!isArray(result.value)) {
		return {
			ok: false,
			error: createInterpretError(result, result.span, "リスト{例: 3b10}"),
		};
	}
	return result;
}
