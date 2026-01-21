import {
	Collection,
	type Guild,
	GuildEmoji,
	type GuildTextBasedChannel,
	type Message,
	MessageReaction,
	type PartialMessage,
	TextChannel,
	User,
} from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

export interface MockReactionOptions {
	isPartial?: boolean;
	isBotReacted?: boolean;
	isBotMessage?: boolean;
	count?: number | null;
	content?: string | null;
	messageId?: string;
	guildId?: string | null;
	messageUrl?: string;
}

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

/**
 * Create a mock reaction for crown testing with additional options
 */
export const mockCrownReaction = (reactionEmoji: string, giverId: string, receiverId: string, options: MockReactionOptions = {}) => {
	const {
		isPartial = false,
		isBotReacted = false,
		isBotMessage = false,
		count = 10,
		content = "Test message content",
		messageId = "7890",
		guildId = "1234567890",
		messageUrl = "https://discord.com/channels/1234567890/1234567890/7890",
	} = options;

	const EmojiMock = mock(GuildEmoji);
	const MessageMock = mock<Message>();
	const ReactionMock = mock(MessageReaction);
	const UserMock = mock(User);
	const AuthorMock = mock(User);
	const GuildMock = mock<Guild>();
	const TextChannelMock = mock(TextChannel);

	// User (who adds reaction)
	when(UserMock.bot).thenReturn(isBotReacted);
	when(UserMock.id).thenReturn(giverId);

	// Emoji
	when(EmojiMock.name).thenReturn(reactionEmoji);

	// Handle partial reaction
	when(ReactionMock.partial).thenReturn(isPartial as false);
	if (isPartial) {
		when(ReactionMock.fetch()).thenResolve(instance(ReactionMock) as any);
		when(MessageMock.fetch()).thenResolve(instance(MessageMock) as any);
	}

	// Author (message author)
	when(AuthorMock.bot).thenReturn(isBotMessage);
	when(AuthorMock.id).thenReturn(receiverId);

	// Message properties
	when(MessageMock.id).thenReturn(messageId);
	when(MessageMock.content).thenReturn(content as string);
	when(MessageMock.guildId).thenReturn(guildId);
	when(MessageMock.url).thenReturn(messageUrl);
	when(MessageMock.author).thenReturn(instance(AuthorMock));

	// Reaction properties
	when(ReactionMock.emoji).thenReturn(instance(EmojiMock));
	when(ReactionMock.count).thenReturn(count as number);
	when(ReactionMock.message).thenReturn(instance(MessageMock));

	// Guild and channel setup
	const channelsCache = new Collection<string, GuildTextBasedChannel>();
	channelsCache.set("crownLogChannelId", instance(TextChannelMock));

	when(GuildMock.channels).thenReturn({
		cache: channelsCache,
		fetch: () => Promise.resolve(channelsCache),
	} as any);

	when(MessageMock.guild).thenReturn(instance(GuildMock));

	return {
		reaction: ReactionMock,
		user: UserMock,
		messageMock: MessageMock,
		authorMock: AuthorMock,
		guildMock: GuildMock,
		textChannelMock: TextChannelMock,
	};
};
