import { MAX_REPLY_CHARACTERS } from "@/src/entities/constants/Discord";

const getDelimiterIndex = (str: string, delimiter: string, pos = 0) => {
	return str.indexOf(delimiter, pos) === -1
		? -1
		: str.indexOf(delimiter, pos) + delimiter.length;
};

const splitByDelimiter = (
	payload: string,
	chunks: Array<string> = new Array<string>(),
	codeBlock = false,
) => {
	const CODE_BLOCK_DELIMITER = "```";
	const PARAGRAPH_DELIMITER = "\n\n";
	const delimiterIndices = codeBlock
		? [
				getDelimiterIndex(
					payload,
					CODE_BLOCK_DELIMITER,
					CODE_BLOCK_DELIMITER.length,
				),
			] // after code block when closing & ignoring open code block quotes
		: [
				getDelimiterIndex(payload, PARAGRAPH_DELIMITER),
				payload.indexOf(CODE_BLOCK_DELIMITER), // before code block when opening
			];

	if (delimiterIndices.every((i) => i < 0)) {
		// no delimiter while EOF

		if (payload.length > MAX_REPLY_CHARACTERS) {
			const tail = payload.substring(MAX_REPLY_CHARACTERS, payload.length);
			chunks.push(payload.substring(0, MAX_REPLY_CHARACTERS));
			return splitByDelimiter(tail, chunks, false);
		}

		return [...chunks, payload];
	}

	const hitDelimiters = delimiterIndices.filter((i) => i !== -1);
	const nextIndex =
		Math.min(...hitDelimiters) > MAX_REPLY_CHARACTERS
			? MAX_REPLY_CHARACTERS
			: Math.min(...hitDelimiters);

	const tail = payload.substring(nextIndex, payload.length);
	chunks.push(payload.substring(0, nextIndex));

	if (
		getDelimiterIndex(payload, PARAGRAPH_DELIMITER) ===
			Math.min(...hitDelimiters) ||
		codeBlock
	) {
		return splitByDelimiter(tail, chunks, false);
	}

	return splitByDelimiter(tail, chunks, true);
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
