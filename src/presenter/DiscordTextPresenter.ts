import { MAX_REPLY_CHARACTERS } from "@/src/entities/constants/Discord";

const getDelimiterIndex = (str: string, delimiter: string, pos = 0) => {
	return str.indexOf(delimiter, pos) === -1
		? -1
		: str.indexOf(delimiter, pos) + delimiter.length;
};

const splitByDelimiter = (
	s: string,
	chunks: Array<string> = new Array<string>(),
	codeBlock = false,
	index = 0,
) => {
	const CODE_BLOCK_DELIMITER = "```";
	const PARAGRAPH_DELIMITER = "\n\n";
	const delimiterIndices = codeBlock
		? [getDelimiterIndex(s, CODE_BLOCK_DELIMITER, CODE_BLOCK_DELIMITER.length)] // after code block when closing & ignoring open code block quotes
		: [
				getDelimiterIndex(s, PARAGRAPH_DELIMITER),
				s.indexOf(CODE_BLOCK_DELIMITER), // before code block when opening
			];
	console.log(index, codeBlock, delimiterIndices, s);

	if (delimiterIndices.every((i) => i < 0)) {
		// no delimiter while EOF
		return [...chunks, s];
	}

	let hitDelimiters = delimiterIndices.filter((i) => i !== -1);
	if (Math.min(...hitDelimiters) > MAX_REPLY_CHARACTERS) {
		hitDelimiters = [2000];
	}

	const tail = s.substring(Math.min(...hitDelimiters), s.length);
	chunks.push(s.substring(0, Math.min(...hitDelimiters)));
	// start code block

	if (!codeBlock && s.indexOf(CODE_BLOCK_DELIMITER) === 0) {
		/*
        case of
        \n\n
        ```
         */
		return splitByDelimiter(tail, chunks, true, index + 1);
	}
	if (
		getDelimiterIndex(s, PARAGRAPH_DELIMITER) === Math.min(...hitDelimiters) ||
		codeBlock
	) {
		return splitByDelimiter(tail, chunks, false, index + 1);
	}

	return splitByDelimiter(tail, chunks, true, index + 1);
};

const chunkBuilder = (chunks: string[], currentRow = new Array<string>()) =>
	chunks.reduce(
		(messageTexts: Array<string>, current) => {
			const lastItem = messageTexts[messageTexts.length - 1];
			console.log(messageTexts);
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

export const DiscordTextPresenter = (string: string) => {
	return new Promise<string>((resolve) => {
		resolve(string);
	})
		.then(splitByDelimiter)
		.then(chunkBuilder);
};
