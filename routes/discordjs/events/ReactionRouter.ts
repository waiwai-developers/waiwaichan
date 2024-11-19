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
			if (reaction.partial) {
				try {
					await reaction.fetch();
					await reaction.message.fetch();
				} catch (err) {
					console.log("fail to fetch old message");
					return;
				}
			}
			if (user.bot) {
				console.log("reaction by bot");
				return;
			}

			if (
				(reaction.message.author?.bot ?? true) ||
				(reaction.message.author?.id ?? null) == null
			) {
				console.log("some data is null");
				return;
			}

			if (reaction.message.author?.id == null) {
				console.log("author id is null");
				return;
			}

			if (reaction.emoji.name !== AppConfig.backend.pointEmoji) {
				console.log("not peer bonus emoji");
				return;
			}

			const res = await this.pointLogic.givePoint(
				new DiscordUserId(reaction.message.author.id),
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
