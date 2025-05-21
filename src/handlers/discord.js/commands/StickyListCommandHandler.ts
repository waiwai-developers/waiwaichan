import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import type { StickyDto } from "@/src/entities/dto/StickyDto";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class StickyListCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.StickyLogic)
	private stickyLogic!: IStickyLogic;
	isHandle(commandName: string): boolean {
		return commandName === "stickylist";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}
		if (interaction.channel == null) {
			return;
		}
		if (
			RoleConfig.users.find((u) => u.discordId === interaction.user.id)
				?.role !== "admin"
		) {
			interaction.reply("スティッキーを表示する権限を持っていないよ！っ");
			return;
		}

		const stickys = await this.stickyLogic.findByCommunityId(
			new DiscordGuildId(interaction.guildId),
		);
		if (stickys.length === 0) {
			await interaction.reply("スティッキーが登録されていなかったよ！っ");
			return;
		}

		await interaction.reply(
			[
				"以下のチャンネルにスティッキーが登録されているよ！",
				...stickys.map((s: StickyDto) => `- <#${s.channelId.getValue()}>`),
			].join("\n"),
		);
	}
}
