import { GuildEmoji, type Message, MessageReaction, type PartialMessage, User } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

export const mockMessage = (authorId: string, isPartial = false, isBotMessage = false) => {
	const MessageMock = mock<Message<true>>();
	const AuthorMock = mock(User);

	if (isPartial) {
		when(MessageMock.fetch()).thenReturn();
	}

	when(AuthorMock.bot).thenReturn(isBotMessage);
	when(AuthorMock.id).thenReturn(authorId);

	when(MessageMock.id).thenReturn("7890");
	when(MessageMock.content).thenReturn("content");
	when(MessageMock.author).thenReturn(instance(AuthorMock));

	return MessageMock;
};

export const waitUntilMessageReply = async (message: Message | PartialMessage, timeout = 15000, atLeast = 1): Promise<void> => {
	const startTime = Date.now();
	return new Promise((resolve, reject) => {
		const interval = setInterval(async () => {
			await new Promise(() => {
				verify(message.reply(anything())).atLeast(atLeast);
				clearInterval(interval);
				resolve();
			}).catch((e) => {
				if (Date.now() - startTime > timeout) {
					clearInterval(interval);
					reject(new Error("Timeout: Method was not called within the time limit."));
				}
			});
		}, 100);
	});
};
