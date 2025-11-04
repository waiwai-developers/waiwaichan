import type {
	MessageReaction,
	MessageReactionEventDetails,
	PartialMessageReaction,
	PartialUser,
	User,
} from "discord.js";

export type ReactionInteraction = {
	reaction: MessageReaction | PartialMessageReaction;
	user: User | PartialUser;
	details: MessageReactionEventDetails;
};
export interface DiscordEventHandler<T> {
	handle(arg: T): Promise<void>;
}

