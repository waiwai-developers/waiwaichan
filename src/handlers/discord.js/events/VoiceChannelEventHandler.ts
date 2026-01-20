import type { VoiceState } from "discord.js";

export type VoiceChannelState = {
	oldState: VoiceState;
	newState: VoiceState;
};
export interface VoiceChannelEventHandler<T> {
	handle(arg: T): Promise<void>;
}
