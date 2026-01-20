import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type {
	VoiceChannelEventHandler,
	VoiceChannelState,
} from "@/src/handlers/discord.js/events/VoiceChannelEventHandler";

import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, VoiceState } from "discord.js";
import { inject, injectable, multiInject } from "inversify";

@injectable()
export class VoiceChannelEventRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@multiInject(HandlerTypes.VoiceChannelEventHandler)
	private readonly handlers!: VoiceChannelEventHandler<VoiceChannelState>[];

	register(client: Client<boolean>): void {
		client.on(
			"voiceStateUpdate",
			async (oldState: VoiceState, newState: VoiceState) => {
				try {
					this.logger.debug(
						`change voice channel status oldState: ${oldState} newState: ${newState}`,
					);
					await Promise.all(
						this.handlers.map((h) => h.handle({ oldState, newState })),
					);
				} catch (error) {
					this.logger.error(`Error: ${error}`);
				}
			},
		);
	}
}
