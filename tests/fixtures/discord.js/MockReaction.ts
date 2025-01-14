import { GuildEmoji, type Message, MessageReaction, type PartialMessage, User } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

export const mockReaction = (
	reaction: string,
	giverId: string,
	receiverId: string,
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

	when(MessageMock.id).thenReturn("7890");
	when(ReactionMock.emoji).thenReturn(instance(EmojiMock));
	when(MessageMock.author).thenReturn(instance(AuthorMock));

	when(ReactionMock.message).thenReturn(instance(MessageMock));

	return {
		reaction: ReactionMock,
		user: UserMock,
		messageMock: MessageMock,
	};
};
