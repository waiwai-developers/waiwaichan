import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommandPermissionChecker } from "@/src/handlers/discord.js/permissions/ICommandPermissionChecker";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client } from "discord.js";
import { inject, injectable, multiInject } from "inversify";

@injectable()
export class SlashCommandRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(HandlerTypes.CommandPermissionChecker)
	private readonly permissionChecker!: ICommandPermissionChecker;

	@multiInject(HandlerTypes.SlashCommandHandler)
	private readonly handlers!: SlashCommandHandler[];

	register(client: Client<boolean>): void {
		client.on("interactionCreate", async (interaction) => {
			try {
				if (!interaction.isChatInputCommand()) return;

				// コマンドハンドラの検索
				const matched = this.handlers.find((h) =>
					h.isHandle(interaction.commandName),
				);
				if (matched == null) {
					this.logger.error(`No Such Command /${interaction.commandName}`);
					await interaction.reply("そんなコマンドはないよ！っ");
					return;
				}

				// 権限チェック
				const permissionResult = await this.permissionChecker.checkPermission(
					interaction,
					interaction.commandName,
				);

				if (!permissionResult.isSuccess) {
					this.logger.info(
						`Permission denied for command /${interaction.commandName}: ${permissionResult.errorMessage}`,
					);
					await interaction.reply(
						permissionResult.errorMessage || "権限がないよ！っ",
					);
					return;
				}

				// コマンド実行
				await matched.handle(interaction);
			} catch (error) {
				this.logger.error(`Error: ${error}`);
				if (interaction.isChatInputCommand()) {
					if (interaction.replied || interaction.deferred) {
						await interaction.editReply(InternalErrorMessage);
					} else {
						await interaction.reply(InternalErrorMessage);
					}
				}
			}
		});
	}
}
