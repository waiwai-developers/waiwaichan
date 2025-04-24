import { EmbedBuilder } from "discord.js";
import { DiceExpression } from "../entities/vo/DiceExpression";
import { IDiceLogic } from "./Interfaces/logics/IDiceLogic";
import { injectable } from "inversify";

@injectable()
export class DiceLogic implements IDiceLogic {
    async dice2(expr: DiceExpression): Promise<EmbedBuilder> {
        const { source, isSecret, showDetails, user } = expr.getValue();
        const result = new Interpreter().interpret(source);

        let embed;
        if (result.ok) {
            const filteredHistory = result.history.filter(s => !/^\d+$/.test(s));
            const lastOrValue = (arr: string[]): string => {
                return arr.length ? arr[arr.length - 1] : `いる${result.value}`
            };
            embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setAuthor({ name: user.displayName, iconURL: (user.avatarURL() ?? user.defaultAvatarURL) })
                .setTitle(source)
                .setDescription(showDetails ? filteredHistory.join('\n') : lastOrValue(filteredHistory));
        } else {
            embed = new EmbedBuilder()
                .setColor(0xE74C3C)
                .setAuthor({ name: user.displayName, iconURL: (user.avatarURL() ?? user.defaultAvatarURL) })
                .setTitle(`エラー: ${source}`)
                .setDescription(result.error);
        }
        if (isSecret) {
            await user.send({ embeds: [embed] });
            embed = new EmbedBuilder()
                .setColor(0x2ECC71)
                .setTitle('🎲シークレットダイス🎲');
        }
        return embed;
    }
}

// ==== Ast ===========================
type Span = {
    line: number;
    column: number;
    length: number;
}

type LocatedInput = {
    text: string;
    span: Span;
}

function locatedInput(text: string): LocatedInput {
    return { text, span: { line: 1, column: 1, length: text.replace(/\s+/g, '').length } };
}

interface BinaryOp {
    lhs: Expr;
    rhs: Expr;
    span: Span;
}

type ArithmeticOp = '+' | '-';
type KeepOp = 'kh' | 'kl';
type CompareOp = '!=' | '=' | '>=' | '<=' | '>' | '<';
type LogicalOp = 'and' | 'or';

type Expr =
    | { type: 'Integer', value: number, span: Span }
    | { type: 'StandardRoll', threshold?: Expr } & BinaryOp
    | { type: 'SpreadRoll', } & BinaryOp
    | { type: 'Keep', op: KeepOp } & BinaryOp
    | { type: 'Access', expr: Expr, index: Expr, span: Span }
    | { type: 'Arithmetic', op: ArithmeticOp } & BinaryOp
    | { type: 'Compare', op: CompareOp } & BinaryOp
    | { type: 'Logical', op: LogicalOp } & BinaryOp


// ==== Error =========================
type DiceError = {
    span: Span;
    expected: string;
    found: string;
    errorPointer: string;
    fatal?: boolean;
};

type ParseResult<T> =
    | { ok: true, value: T, remaining: LocatedInput }
    | { ok: false, error: DiceError }

type InterpretOk = { ok: true, value: number | number[] | boolean, span: Span, formatedData: string };
type InterpretResult =
    | InterpretOk
    | { ok: false, error: DiceError }

type ExecuteResult =
    | { ok: true, value: number | number[] | boolean, history: string[] }
    | { ok: false, error: string }

function createParseError(input: LocatedInput, expected: string): DiceError {
    const pointerLine = ' '.repeat(input.span.column - 1) + '^'.repeat(Math.max(1, input.span.length)) + '🤔';
    return {
        span: input.span,
        expected,
        found: input.text.charAt(0) || 'EOF',
        errorPointer: pointerLine,
    }
}

function createInterpretError(expr: Extract<InterpretResult, { ok: true }>, span: Span, expected: string): DiceError {
    const pointerLine = ' '.repeat(expr.span.column - 1) + '^'.repeat(span.length) + '🤔';
    return {
        span: expr.span,
        expected,
        found: `${expr.value}`,
        errorPointer: pointerLine,
    }
}

function formatError(error: DiceError, original: string): string {
    const expected = [...new Set(error.expected.split(ALT_TEXT))].join(ALT_TEXT);
    const found = error.found.trim().length == 0 ? '<空>' : `${error.found}`;
    return `入力に誤りがあるよ！[${error.span.line}行 ${error.span.column}番目]

期待するもの: ${expected}
見つかったもの: ${found}

\`\`\`txt
${extractLine(original, error.span.line)}
${error.errorPointer}
\`\`\`
`
}

function extractLine(text: string, line: number): string {
    return text.split('\n')[line - 1] || '';
}


// ==== Mynom =========================

type Parser<T> = (input: LocatedInput) => ParseResult<T>;

const ALT_TEXT = ' または ';

function updatePos(input: LocatedInput, consumed: string): LocatedInput {
    if (!consumed) return input;

    let line = input.span.line;
    let column = input.span.column;

    for (const ch of consumed) {
        if (ch === '\n') {
            line++;
            column = 1;
        } else {
            column++;
        }
    }
    input.span.length = consumed.length;
    // return remaining
    return {
        text: input.text.slice(consumed.length),
        span: {
            line: line,
            column: column,
            length: input.text.length - consumed.length,
        }
    };
}

function whitespace(): Parser<string> {
    return (input) => {
        const whitespace = input.text.match(/^[\s\n]+/);
        if (whitespace) {
            const matched = whitespace[0];
            return {
                ok: true,
                value: matched,
                remaining: updatePos(input, matched)
            };
        }
        // 空白が無くても成功するオプショナルパーサ
        return {
            ok: true,
            value: '',
            remaining: input
        };
    };
}

const integer: Parser<number> = (input) => {
    const match = input.text.match(/^\d+/);
    if (!match) return {
        ok: false,
        error: createParseError(input, '数値{例: 1}')
    };
    return {
        ok: true,
        value: parseInt(match[0], 10),
        remaining: updatePos(input, match[0])
    };
}

function tag(token: string): Parser<string> {
    return (input) => {
        if (input.text.startsWith(token)) {
            return { ok: true, value: token, remaining: updatePos(input, token) };
        }
        const expected = token == '(' ? '括弧付き式{例: (1d6 + 3)}' : `'${token}'`;
        return {
            ok: false,
            error: createParseError(input, expected)
        };
    };
}

// 一旦これで
function alt<T>(...parsers: Parser<T>[]): Parser<T> {
    return (input) => {
        let errors: string[] = [];
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
            error: createParseError(
                input,
                errors.join(ALT_TEXT),
            )
        };
    };
}

function delimited<F, G, H>(prefixParser: Parser<F>, parser: Parser<G>, postfixParser: Parser<H>): Parser<G> {
    return (input) => {
        const prefixResult = prefixParser(input);
        if (!prefixResult.ok) return prefixResult;
        const reuslt = parser(prefixResult.remaining);
        if (!reuslt.ok) return reuslt;
        const postfixResult = postfixParser(reuslt.remaining);
        if (!postfixResult.ok) return cut(postfixResult);
        return {
            ok: true,
            value: reuslt.value,
            remaining: postfixResult.remaining,
        }
    }
}

function spaceDelimited<T>(parser: Parser<T>): Parser<T> {
    return (input) => {
        const result = delimited(whitespace(), parser, whitespace())(input);
        if (!result.ok) return result;
        return result;
    };
}

function pair<F, G>(first: Parser<F>, second: Parser<G>): Parser<[F, G]> {
    return (input) => {
        const firstResult = first(input);
        if (!firstResult.ok) return {
            ok: false,
            error: firstResult.error
        };
        const secondResult = second(firstResult.remaining);
        if (!secondResult.ok) return cut({
            ok: false,
            error: secondResult.error
        });
        return {
            ok: true,
            value: [firstResult.value, secondResult.value],
            remaining: secondResult.remaining
        };
    };
}

function foldMany0<F, H>(parser: Parser<F>, init: H, g: (acc: H, item: F) => H): Parser<H> {
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

function foldOnce<F, H>(parser: Parser<F>, init: H, g: (acc: H, item: F) => H): Parser<H> {
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
    }
}

function withErrorContext<T>(parser: Parser<T>, context: string): Parser<T> {
    return (input) => {
        const result = parser(input);
        if (!result.ok) {
            return {
                ok: false,
                error: {
                    ...result.error,
                    expected: context,
                }
            };
        }
        return result;
    }
}

function cut<T, E extends DiceError>(result: { ok: false, error: E }): ParseResult<T> {
    result.error.fatal = true;
    return result;
}

// ==== Parser ========================
function binary<T extends string>(
    operandParser: Parser<Expr>,
    opParser: Parser<T>,
    resultType: any,
    valErrorContext: string,
): Parser<Expr> {
    return (input) => {
        const r0 = operandParser(input);
        if (!r0.ok) return r0;

        return foldMany0<[T, Expr], Expr>(
            ((input): ParseResult<[T, Expr]> => {
                const result = pair(opParser, withErrorContext(operandParser, valErrorContext))(input);
                if (!result.ok) return result;
                const [op, val] = result.value;
                return {
                    ok: true,
                    value: [op, val],
                    remaining: result.remaining
                };
            }),
            r0.value,
            (acc, [currentOp, val]) => {
                const span = {
                    line: acc.span.line,
                    column: acc.span.column,
                    length: acc.span.length + currentOp.length + val.span.length,
                };
                return {
                    type: resultType,
                    op: currentOp as any,
                    lhs: acc,
                    rhs: val,
                    span,
                } as any;
            }
        )(r0.remaining);
    };
}

const integerExpr: Parser<Expr> = (input) => {
    const result = spaceDelimited(integer)(input);
    if (!result.ok) return result;

    return { ok: true, value: { type: 'Integer', value: result.value, span: input.span }, remaining: result.remaining };
}

const paren: Parser<Expr> = (input) => {
    const exprResult = delimited(
        spaceDelimited(tag('(')),
        spaceDelimited(expr),
        spaceDelimited(tag(')')))(input);
    if (!exprResult.ok) return exprResult;
    return exprResult;
}

const primary: Parser<Expr> = (input) => {
    return alt(paren, integerExpr)(input);
}

// const standardRoll: Parser<Expr> = binary(
//     primary,
//     spaceDelimited(alt(tag('d'), tag('D'))),
//     'StandardRoll',
//     'ダイスの面',
// );
const standardRoll: Parser<Expr> = (input) => {
    const r0 = primary(input);
    if (!r0.ok) return r0;

    return foldMany0<{ dice: [string, Expr], crit?: [string, Expr] }, Expr>(
        ((input): ParseResult<{ dice: [string, Expr], crit?: [string, Expr] }> => {
            const diceResult = pair(spaceDelimited(alt(tag('d'), tag('D'))), withErrorContext(primary, 'ダイスの面'))(input);
            if (!diceResult.ok) return diceResult;
            let remaining = diceResult.remaining;

            // クリティカルがある？
            let crit: [string, Expr] | undefined = undefined;
            const critResult = pair(spaceDelimited(alt(tag('critical'), tag('crit'), tag('c'), tag('C'))),
                withErrorContext(alt(standardRoll, primary), 'クリティカル、ファンブルの閾値(数値)'))(remaining);
            if (critResult.ok) {
                crit = critResult.value;
                remaining = critResult.remaining;
            }
            return {
                ok: true,
                value: { dice: diceResult.value, crit },
                remaining,
            }
        }),
        r0.value,
        (acc, { dice, crit }) => {
            const span = {
                line: acc.span.line,
                column: acc.span.line,
                length: acc.span.length + dice[0].length + dice[1].span.length + (crit?.[0].length || 0) + (crit?.[1].span.length || 0),
            };
            return {
                type: 'StandardRoll',
                lhs: acc,
                rhs: dice[1],
                threshold: crit?.[1],
                span,
            };
        }
    )(r0.remaining);
};

const spreadRoll: Parser<Expr> = (input) => {
    const countResult = standardRoll(input);
    if (!countResult.ok) return countResult;
    return foldOnce(
        pair(spaceDelimited(alt(tag('b'), tag('B'))),
            withErrorContext(alt(standardRoll), 'ダイスの面(数値)')),
        countResult.value,
        (acc, [tag, val]) => {
            const span = {
                line: acc.span.line,
                column: acc.span.column,
                length: acc.span.length + val.span.length + tag.length,
            };
            return {
                type: 'SpreadRoll',
                lhs: acc,
                rhs: val,
                span,
            } as any
        }
    )(countResult.remaining);
}

const keep: Parser<Expr> = binary(
    spreadRoll,
    alt(tag('kh'), tag('kl')),
    'Keep',
    'Keepする数'
);

const access: Parser<Expr> = (input) => {
    const exprResult = keep(input);
    if (!exprResult.ok) return exprResult;
    return foldOnce(
        delimited(
            spaceDelimited(tag('[')),
            withErrorContext(spaceDelimited(expr), 'インデックス(数値)'),
            spaceDelimited(tag(']'))),
        exprResult.value,
        (acc, index) => {
            const span = {
                line: acc.span.line,
                column: acc.span.column,
                length: acc.span.length + index.span.length + 2
            };
            return {
                ok: true,
                type: 'Access',
                expr: acc,
                index: index,
                span,
            } as any
        }
    )(exprResult.remaining);
}

const arithmetic: Parser<Expr> = binary(
    access,
    alt(tag('+'), tag('-')),
    'Arithmetic',
    '右側の項',
);

const compare: Parser<Expr> = binary(
    arithmetic,
    alt(tag('!='), tag('='), tag('<='), tag('>='), tag('<'), tag('>')),
    'Compare',
    '比較する項',
);

const logicalAnd: Parser<Expr> = binary(
    compare,
    tag('and'),
    'Logical',
    '比較する項',
)

const logicalOr: Parser<Expr> = binary(
    logicalAnd,
    tag('or'),
    'Logical',
    '比較する項',
)

const expr: Parser<Expr> = (input) => {
    return logicalOr(input);
}

const parseProgram: Parser<Expr> = (input) => {
    const result = expr(input);
    if (!result.ok) return result;
    // remainingが残っていたらエラー
    const remaining = spaceDelimited(whitespace())(result.remaining);
    if (remaining.ok && remaining.remaining.text !== '') {
        return {
            ok: false,
            error: createParseError(result.remaining,
                '<余計な入力があります>')
        };
    }
    // 正常
    return result;
}


// ==== Interpreter ===================
class Interpreter {
    private history: InterpretOk[];

    constructor() {
        this.history = [];
    }

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
            history: this.history.map(x => x.formatedData),
            value: result.value
        };
    }

    private addHistory(value: InterpretOk): InterpretResult {
        this.history.push(value);
        return value;
    }

    private evalExpr(expr: Expr): InterpretResult {
        switch (expr.type) {
            case 'Integer': {
                return this.addHistory(
                    {
                        ok: true, value: expr.value, span: expr.span,
                        formatedData: `${expr.value}`
                    },
                );
            }
            case 'StandardRoll': {
                const count = validateNumber(this.evalExpr(expr.lhs));
                if (!count.ok) return count;
                const sides = validateNumber(this.evalExpr(expr.rhs));
                if (!sides.ok) return sides;
                const value = [...Array(count.value)]
                    .map(_ => random(sides.value as number))
                    .reduce((acc, x) => { return acc + x; }, 0);
                // クリティカル判定
                let crit = "";
                if (expr.threshold) {
                    const threshold = validateNumber(this.evalExpr(expr.threshold));
                    if (!threshold.ok) return threshold;
                    crit = (value as number) <= (threshold.value as number) ? '🎯'
                        : ((value as number) >= (sides.value as number) - (threshold.value as number)) ? '💀'
                            : '';
                }
                return this.addHistory({
                    ok: true, value, span: expr.span,
                    formatedData: `${count.value}d${sides.value} → ${value}${crit}`
                });
            }
            case 'SpreadRoll': {
                const count = validateNumber(this.evalExpr(expr.lhs));
                if (!count.ok) return count;
                const sides = validateNumber(this.evalExpr(expr.rhs));
                if (!sides.ok) return sides;
                const value = [...Array(count.value)]
                    .map(_ => random(sides.value as number));
                return this.addHistory({
                    ok: true, value, span: expr.span,
                    formatedData: `${count.value}b${sides.value} → [${value}]`
                });
            }
            case 'Keep': {
                const lhs = validateArray(this.evalExpr(expr.lhs));
                if (!lhs.ok) return lhs;
                lhs.value = lhs.value as number[];
                const rhs = validateNumber(this.evalExpr(expr.rhs));
                if (!rhs.ok) return rhs;
                rhs.value = rhs.value as number;
                if (rhs.value > lhs.value.length || rhs.value < 0) {
                    return { ok: false, error: createInterpretError(rhs, rhs.span, `0 <= idx <= ${lhs.value.length}`) }
                }
                const compare = expr.op == 'kh' ? (a: number, b: number) => (b - a) : (a: number, b: number) => (a - b);
                const value = lhs.value.slice().sort(compare).slice(0, rhs.value);
                return this.addHistory({
                    ok: true, value, span: expr.span,
                    formatedData: `[${lhs.value}]${expr.op}${rhs.value} → [${value}]`
                });
            }
            case 'Access': {
                let data = validateArray(this.evalExpr(expr.expr));
                if (!data.ok) return data;
                data.value = data.value as number[];
                const index = validateNumber(this.evalExpr(expr.index));
                if (!index.ok) return index;
                index.value = index.value as number;
                if (index.value >= data.value.length || index.value < 0) {
                    return { ok: false, error: createInterpretError(index, index.span, `0 <= idx < ${data.value.length}`) }
                }
                const value = data.value[index.value];
                return this.addHistory({
                    ok: true, value, span: expr.span,
                    formatedData: `[${data.value}][${index.value}] → ${value}`
                });
            }
            case 'Arithmetic': {
                const lhs = this.evalExpr(expr.lhs);
                if (!lhs.ok) return lhs;
                const rhs = this.evalExpr(expr.rhs);
                if (!rhs.ok) return rhs;
                if (isArray(lhs.value)) {
                    if (isArray(rhs.value) && expr.op == '+') {
                        const value = lhs.value.concat(rhs.value);
                        return this.addHistory({
                            ok: true, value, span: expr.span,
                            formatedData: `${lhs.value} ${expr.op} ${rhs.value} → ${value}`
                        });
                    } else if (isNumber(rhs.value)) {
                        const rhsValue = expr.op == '+' ? rhs.value : -rhs.value;
                        const value = lhs.value.map(x => x + rhsValue);
                        return this.addHistory({
                            ok: true, value, span: expr.span,
                            formatedData: `${lhs.value} ${expr.op} ${rhs.value} → ${value}`
                        });
                    }
                } else if (isNumber(lhs.value) && isNumber(rhs.value)) {
                    const value = expr.op == '+' ? lhs.value + rhs.value : lhs.value - rhs.value;
                    return this.addHistory({
                        ok: true, value, span: expr.span,
                        formatedData: `${lhs.value} ${expr.op} ${rhs.value} → ${value}`
                    });
                }
                return {
                    ok: false,
                    error: createInterpretError(lhs, expr.span,
                        '数値と数値 または リストとリスト または リストと数値')
                };
            }
            case 'Compare': {
                // a < b < c -> a < b and b < cに変換する
                if (expr.lhs.type == 'Compare') {
                    const lhs = expr.lhs;
                    expr.lhs = {
                        type: 'Logical',
                        op: 'and',
                        lhs: { type: 'Compare', op: lhs.op, lhs: lhs.lhs, rhs: lhs.rhs, span: lhs.span },
                        rhs: { type: 'Compare', op: expr.op, lhs: lhs.rhs, rhs: expr.rhs, span: lhs.span },
                        span: expr.lhs.span
                    }
                    return this.evalExpr(expr);
                }
                const lhs = this.evalExpr(expr.lhs);
                if (!lhs.ok) return lhs;
                const rhs = this.evalExpr(expr.rhs);
                if (!rhs.ok) return rhs;
                if (isBoolean(lhs.value)) {
                    return this.addHistory({
                        ok: true, value: lhs.value, span: expr.span,
                        formatedData: `${lhs.value ? '✅' : '❌'}`
                    });
                }
                else if (!isNumber(lhs.value)) {
                    return { ok: false, error: createInterpretError(lhs, lhs.span, '数値と数値') };
                } else if (!isNumber(rhs.value)) {
                    return { ok: false, error: createInterpretError(lhs, rhs.span, '数値と数値') };
                }
                let value = false;
                switch (expr.op) {
                    case '!=': value = lhs.value != rhs.value; break;
                    case '=': value = lhs.value == rhs.value; break;
                    case '<': value = lhs.value < rhs.value; break;
                    case '<=': value = lhs.value <= rhs.value; break;
                    case '>': value = lhs.value > rhs.value; break;
                    case '>=': value = lhs.value >= rhs.value; break;
                }
                return this.addHistory({
                    ok: true, value, span: expr.span,
                    formatedData: `${lhs.value} ${expr.op} ${rhs.value} → ${value ? '✅' : '❌'}`
                });
            }
            case 'Logical': {
                const lhs = this.evalExpr(expr.lhs);
                if (!lhs.ok) return lhs;
                const rhs = this.evalExpr(expr.rhs);
                if (!rhs.ok) return rhs;
                if (!isBoolean(lhs.value)) {
                    return { ok: false, error: createInterpretError(lhs, lhs.span, '真偽値と真偽値') };
                } else if (!isBoolean(rhs.value)) {
                    return { ok: false, error: createInterpretError(rhs, rhs.span, '真偽値と真偽値') };
                }
                const value = expr.op == 'and' ? lhs.value && rhs.value : lhs.value || rhs.value;
                return this.addHistory({
                    ok: true, value, span: expr.span,
                    formatedData: `${lhs.value} ${expr.op} ${rhs.value} → ${value ? '✅' : '❌'}`
                });
            }
        }
    }


}

function random(limit: number): number {
    return limit === 0 ? 0 : Math.floor(Math.random() * limit) + 1;
}

function isBoolean(value: any): value is number[] {
    return typeof value == 'boolean';
}

function isNumber(value: any): value is number {
    return typeof value == 'number';
}

function isArray(value: any): value is number[] {
    return typeof value == 'object' && value != null;
}

function validateNumber(result: InterpretResult): InterpretResult {
    if (!result.ok) return result;
    if (!isNumber(result.value)) {
        return { ok: false, error: createInterpretError(result, result.span, '数値') };
    }
    return result;
}

function validateArray(result: InterpretResult): InterpretResult {
    if (!result.ok) return result;
    if (!isArray(result.value)) {
        return { ok: false, error: createInterpretError(result, result.span, 'リスト{例: 3b10}') };
    }
    return result;
}