import { MAX_REPLY_CHARACTERS } from "@/src/entities/constants/Discord";

const lastIndexOf = (str: string, delimiter: string, pos = 0) => {
	return str.indexOf(delimiter, pos) === -1
		? -1
		: str.indexOf(delimiter, pos) + delimiter.length;
};

const splitStringByIndex = (str: string, index: number) => {
	return [str.substring(0, index), str.substring(index, str.length)];
};

const splitByDelimiter = (
	payload: string,
	chunks: Array<string> = new Array<string>(),
	codeBlock = false,
) => {
	const CODE_BLOCK_DELIMITER = "```";
	const PARAGRAPH_DELIMITER = "\n\n";
	const delimiterIndices = codeBlock
		? [lastIndexOf(payload, CODE_BLOCK_DELIMITER, CODE_BLOCK_DELIMITER.length)] // after code block when closing & ignoring open code block quotes
		: [
				lastIndexOf(payload, PARAGRAPH_DELIMITER),
				payload.indexOf(CODE_BLOCK_DELIMITER), // before code block when opening
			];

	const hitDelimiters = delimiterIndices.filter((i) => i >= 0);
	if (hitDelimiters.length === 0) {
		// no delimiter while EOF

		if (payload.length > MAX_REPLY_CHARACTERS) {
			const [head, tail] = splitStringByIndex(payload, MAX_REPLY_CHARACTERS);
			chunks.push(head);
			return splitByDelimiter(tail, chunks, false);
		}

		return [...chunks, payload];
	}

	const nextIndex = Math.min(...hitDelimiters, MAX_REPLY_CHARACTERS);
	const [head, tail] = splitStringByIndex(payload, nextIndex);
	chunks.push(head);

	return splitByDelimiter(
		tail,
		chunks,
		lastIndexOf(payload, CODE_BLOCK_DELIMITER) === nextIndex && !codeBlock,
	);
};

const chunkBuilder = (chunks: string[], currentRow = new Array<string>()) =>
	chunks.reduce(
		(messageTexts: Array<string>, current) => {
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

export const DiscordTextPresenter = async (string: string) => {
	return await new Promise<string>((resolve) => {
		resolve(string);
	})
		.then(splitByDelimiter)
		.then(chunkBuilder);
};
