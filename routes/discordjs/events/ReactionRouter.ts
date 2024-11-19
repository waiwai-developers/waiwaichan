import { AppConfig } from "@/entities/config/AppConfig";
import { DiscordMessageId } from "@/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { IPointLogic } from "@/logics/Interfaces/logics/IPointLogic";
import type { DiscordEventRouter } from "@/routes/discordjs/events/DiscordEventRouter";
import type { Client } from "discord.js";

export class ReactionRouter implements DiscordEventRouter {
	constructor(private pointLogic: IPointLogic) {}
	register(client: Client): void {
		client.on("messageReactionAdd", async (reaction, user) => {
			if (user.bot) return;
			if (
				(reaction.message.author?.bot ?? true) ||
				(reaction.message.author?.id ?? null) == null
			)
				return;
			if (
				reaction.message.author?.id
					? user.id === reaction.message.author?.id
					: true
			)
				return;

			if (reaction.emoji.name === AppConfig.backend.pointEmoji) {
			}

			const res = await this.pointLogic.givePoint(
				// absolutely non null
				new DiscordUserId(reaction.message.author?.id ?? ""),
				new DiscordUserId(user.id),
				new DiscordMessageId(reaction.message.id),
			);

			if (!res) {
				return;
			}
			await reaction.message.reply(res);
		});
	}
}
