import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import type { SlashCommandHandler } from "./SlashCommandHandler";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { IDiceLogic } from "@/src/logics/Interfaces/logics/IDiceLogic";
import { DiceSource } from "@/src/entities/vo/DiceSource";
import { DiceIsSecret } from "@/src/entities/vo/DiceIsSecret";
import { DiceShowDetails } from "@/src/entities/vo/DiceShowDetails";
import { DiceContextDto } from "@/src/entities/dto/DiceContextDto";
import { DiscordUserDisplayName } from "@/src/entities/vo/DiscordUserDisplayName";
import { DiscordUserDefaultAvatarURL } from "@/src/entities/vo/DiscordUserDefaultAvatarURL";
import { EmbedBuilder } from "discord.js";

@injectable()
export class DiceCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.DiceLogic)
	private diceLogic!: IDiceLogic;

	isHandle(commandName: string): boolean {
		return commandName === "dice";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		const context = new DiceContextDto(
			new DiceSource(interaction.options?.getString("source", true)),
			new DiceIsSecret(!!interaction.options?.getBoolean("secret", false)),
			new DiceShowDetails(!!interaction.options?.getBoolean("details", false)),
		);
		const userDisplayName = new DiscordUserDisplayName(
			interaction.user.displayName,
		);
		const userDefaultAvatarURL = new DiscordUserDefaultAvatarURL(
			interaction.user.defaultAvatarURL,
		);
		const diceResult = await this.diceLogic.dice(context);

		let embed = new EmbedBuilder()
			.setColor(diceResult.ok.getValue() ? 0x2ecc71 : 0xe74c3c)
			.setAuthor({
				name: userDisplayName.getValue(),
				iconURL:
					interaction.user.avatarURL() ?? userDefaultAvatarURL.getValue(),
			})
			.setTitle(diceResult.title.getValue())
			.setDescription(diceResult.description.getValue());

		if (context.isSecret.getValue()) {
			await interaction.user.send({ embeds: [embed] });
			embed = new EmbedBuilder()
				.setColor(0x2ecc71)
				.setTitle("🎲シークレットダイス🎲");
		}

		await interaction.reply({
			embeds: [embed],
		});
	}
}
