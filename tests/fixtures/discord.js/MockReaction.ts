import { GuildEmoji, type Message, MessageReaction, type PartialMessage, User } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

export const mockReaction = (
	reaction: string,
	giverId: string,
	receiverId: string,
	messageId = "7890",
	isPartial = false,
	isBotReacted = false,
	isBotMessage = false,
) => {
	const EmojiMock = mock(GuildEmoji);
	const MessageMock = mock<Message>();
	const ReactionMock = mock(MessageReaction);
	const UserMock = mock(User);
	const AuthorMock = mock(User);

	when(UserMock.bot).thenReturn(isBotReacted);
	when(UserMock.id).thenReturn(giverId);
	when(EmojiMock.name).thenReturn(reaction);

	if (isPartial) {
		when(ReactionMock.fetch).thenReturn(instance(mock<() => Promise<MessageReaction>>()));
		when(ReactionMock.fetch()).thenReturn();
		when(MessageMock.fetch()).thenReturn();
	}

	when(AuthorMock.bot).thenReturn(isBotMessage);
	when(AuthorMock.id).thenReturn(receiverId);

	when(MessageMock.id).thenReturn(messageId);
	when(ReactionMock.emoji).thenReturn(instance(EmojiMock));
	when(MessageMock.author).thenReturn(instance(AuthorMock));

	when(ReactionMock.message).thenReturn(instance(MessageMock));

	return {
		reaction: instance(ReactionMock),
		user: instance(UserMock),
		messageMock: MessageMock,
	};
};

export const waitUntilReply = async (message: Message | PartialMessage, timeout = 15000, atLeast = 1): Promise<void> => {
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
