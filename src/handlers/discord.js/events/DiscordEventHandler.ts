import type {
	Client,
	MessageReaction,
	MessageReactionEventDetails,
	PartialMessageReaction,
	PartialUser,
	User,
} from "discord.js";

export type ReactionInteraction = {
	client: Client;
	reaction: MessageReaction | PartialMessageReaction;
	user: User | PartialUser;
	details: MessageReactionEventDetails;
};
export interface DiscordEventHandler<T> {
	handle(arg: T): Promise<void>;
}
