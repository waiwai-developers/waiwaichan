import { MAX_REPLY_CHARACTERS } from "@/src/entities/constants/Discord";

/**
 * コードブロックの状態を表すモデル
 */
interface CodeBlockState {
	isInside: boolean;
	language: string;
}

/**
 * 分割結果を表すモデル
 */
interface SplitResult {
	head: string;
	tail: string;
}

/**
 * デリミタのインデックス情報
 */
interface DelimiterIndices {
	paragraphIndex: number;
	codeBlockIndex: number;
}

/**
 * コードブロック関連の定数
 */
const CODE_BLOCK = {
	DELIMITER: "```",
	CLOSE_MARKER: "```",
	MARGIN: 4, // ``` + 改行
} as const;

const PARAGRAPH_DELIMITER = "\n\n";

/**
 * 文字列操作のユーティリティクラス
 */
class StringUtils {
	/**
	 * 指定位置以降の最初のデリミタ位置を取得
	 */
	static lastIndexOf(str: string, delimiter: string, pos = 0): number {
		return str.indexOf(delimiter, pos) === -1
			? -1
			: str.indexOf(delimiter, pos) + delimiter.length;
	}

	/**
	 * 指定位置で文字列を分割
	 */
	static splitAt(str: string, index: number): SplitResult {
		return {
			head: str.substring(0, index),
			tail: str.substring(index),
		};
	}

	/**
	 * 最後の改行位置を取得（指定範囲内）
	 */
	static findLastNewlineInRange(
		str: string,
		searchStart: number,
		minPosition: number,
	): number {
		const lastNewline = str.lastIndexOf("\n");
		if (lastNewline > minPosition && lastNewline <= searchStart) {
			return lastNewline + 1;
		}
		return -1;
	}
}

/**
 * コードブロック処理のユーティリティクラス
 */
class CodeBlockHandler {
	/**
	 * コードブロックの言語指定を抽出
	 */
	static extractLanguage(codeBlockStart: string): string {
		const lines = codeBlockStart.split("\n");
		if (lines.length === 0) return "";

		const firstLine = lines[0];
		const match = firstLine.match(/^```(\w+)?/);
		return match?.[1] || "";
	}

	/**
	 * コードブロック開始マーカーを生成
	 */
	static createOpenMarker(language: string): string {
		return language
			? `${CODE_BLOCK.DELIMITER}${language}\n`
			: `${CODE_BLOCK.DELIMITER}\n`;
	}

	/**
	 * コードブロック内で分割が必要な場合の処理
	 */
	static splitLongCodeBlock(
		payload: string,
		language: string,
	): { chunk: string; remaining: string } {
		const splitPoint = MAX_REPLY_CHARACTERS - CODE_BLOCK.MARGIN;
		const { head, tail } = StringUtils.splitAt(payload, splitPoint);

		// 行の途中で分割しないよう、最後の改行位置を探す
		const lastNewlinePos = StringUtils.findLastNewlineInRange(
			head,
			head.length,
			splitPoint - 100,
		);

		if (lastNewlinePos > 0) {
			const adjusted = StringUtils.splitAt(payload, lastNewlinePos);
			return {
				chunk: adjusted.head + CODE_BLOCK.CLOSE_MARKER + "\n",
				remaining: "\n" + CodeBlockHandler.createOpenMarker(language) + adjusted.tail,
			};
		}

		return {
			chunk: head + CODE_BLOCK.CLOSE_MARKER + "\n",
			remaining: "\n" + CodeBlockHandler.createOpenMarker(language) + tail,
		};
	}
}

/**
 * テキスト分割処理のメインクラス
 */
class TextSplitter {
	/**
	 * デリミタの位置を検索
	 */
	private static findDelimiterIndices(
		payload: string,
		codeBlockState: CodeBlockState,
	): DelimiterIndices {
		if (codeBlockState.isInside) {
			// コードブロック内: 閉じタグを探す
			const closeIndex = StringUtils.lastIndexOf(
				payload,
				CODE_BLOCK.DELIMITER,
				CODE_BLOCK.DELIMITER.length,
			);
			
			// 閉じタグが2000文字以内にない、または見つからない場合は-1を返す
			// これにより、handleNoDelimiterで強制分割される
			if (closeIndex < 0 || closeIndex > MAX_REPLY_CHARACTERS) {
				return {
					paragraphIndex: -1,
					codeBlockIndex: -1,
				};
			}
			
			return {
				paragraphIndex: -1,
				codeBlockIndex: closeIndex,
			};
		}

		// コードブロック外: 段落区切りと開きタグを探す
		return {
			paragraphIndex: StringUtils.lastIndexOf(payload, PARAGRAPH_DELIMITER),
			codeBlockIndex: payload.indexOf(CODE_BLOCK.DELIMITER),
		};
	}

	/**
	 * デリミタが見つからない場合の処理
	 */
	private static handleNoDelimiter(
		payload: string,
		chunks: string[],
		codeBlockState: CodeBlockState,
	): string[] {
		if (payload.length <= MAX_REPLY_CHARACTERS) {
			return [...chunks, payload];
		}

		// コードブロック内で2000文字超過
		if (codeBlockState.isInside) {
			const { chunk, remaining } = CodeBlockHandler.splitLongCodeBlock(
				payload,
				codeBlockState.language,
			);
			chunks.push(chunk);
			return this.split(remaining, chunks, {
				isInside: true,
				language: codeBlockState.language,
			});
		}

		// 通常のテキストで2000文字超過
		const { head, tail } = StringUtils.splitAt(payload, MAX_REPLY_CHARACTERS);
		chunks.push(head);
		return this.split(tail, chunks, { isInside: false, language: "" });
	}

	/**
	 * デリミタで分割
	 */
	private static splitAtDelimiter(
		payload: string,
		chunks: string[],
		codeBlockState: CodeBlockState,
		delimiterIndices: DelimiterIndices,
	): string[] {
		const validIndices = [
			delimiterIndices.paragraphIndex,
			delimiterIndices.codeBlockIndex,
		].filter((i) => i >= 0);

		const nextIndex = Math.min(...validIndices, MAX_REPLY_CHARACTERS);
		const { head, tail } = StringUtils.splitAt(payload, nextIndex);

		// コードブロックから出るかチェック（閉じタグで分割）
		const isExitingCodeBlock =
			codeBlockState.isInside &&
			delimiterIndices.codeBlockIndex === nextIndex;

		// コードブロックに入るかチェック
		const isEnteringCodeBlock =
			!codeBlockState.isInside &&
			delimiterIndices.codeBlockIndex === nextIndex;

		const newState: CodeBlockState = isExitingCodeBlock
			? { isInside: false, language: "" }
			: isEnteringCodeBlock
				? {
						isInside: true,
						language: CodeBlockHandler.extractLanguage(tail),
					}
				: codeBlockState;

		chunks.push(head);
		return this.split(tail, chunks, newState);
	}

	/**
	 * 再帰的に文字列を分割
	 */
	static split(
		payload: string,
		chunks: string[] = [],
		codeBlockState: CodeBlockState = { isInside: false, language: "" },
	): string[] {
		const delimiterIndices = this.findDelimiterIndices(payload, codeBlockState);
		const hasDelimiters =
			delimiterIndices.paragraphIndex >= 0 ||
			delimiterIndices.codeBlockIndex >= 0;

		if (!hasDelimiters) {
			return this.handleNoDelimiter(payload, chunks, codeBlockState);
		}

		return this.splitAtDelimiter(
			payload,
			chunks,
			codeBlockState,
			delimiterIndices,
		);
	}
}

/**
 * チャンクを結合してメッセージ配列を作成
 */
class ChunkBuilder {
	static build(chunks: string[]): string[] {
		return chunks.reduce(
			(messageTexts: string[], current) => {
				const lastItem = messageTexts[messageTexts.length - 1];

				if (lastItem.length + current.length > MAX_REPLY_CHARACTERS) {
					messageTexts.push(current);
					return messageTexts;
				}

				return [
					...messageTexts.slice(0, messageTexts.length - 1),
					lastItem + current,
				];
			},
			[""],
		);
	}
}

/**
 * Discord用テキストプレゼンター
 * 長いテキストを2000文字以内のチャンクに分割
 */
export const DiscordTextPresenter = async (string: string): Promise<string[]> => {
	const chunks = TextSplitter.split(string);
	return ChunkBuilder.build(chunks);
};
