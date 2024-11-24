import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChoiceContent } from "@/src/entities/vo/ChoiceContent";
import { DiceSides } from "@/src/entities/vo/DiceSides";
import { HelpCategory } from "@/src/entities/vo/HelpCategory";
import { ParrotMessage } from "@/src/entities/vo/ParrotMessage";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type {
	CacheType,
	ChatInputCommandInteraction,
	TextChannel,
} from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "./SlashCommandHandler";

@injectable()
class HelpCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "help";
	}
	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.utilLogic.help(
				new HelpCategory(interaction.options?.getString("category") ?? ""),
			),
		);
	}
}

@injectable()
class WaiwaiCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "waiwai";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(await this.utilLogic.waiwai());
	}
}

@injectable()
class ParrotCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "parrot";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.utilLogic.parrot(
				new ParrotMessage(interaction.options?.getString("message") ?? ""),
			),
		);
	}
}

@injectable()
class DiceCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "dice";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.utilLogic.dice(
				new DiceSides(interaction.options?.getInteger("parameter") ?? 0),
			),
		);
	}
}

@injectable()
class ChoiceCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.UtilityLogic)
	private utilLogic!: IUtilityLogic;
	isHandle(commandName: string): boolean {
		return commandName === "choice";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.reply(
			await this.utilLogic.choice(
				(interaction.options?.getString("items")?.split(" ") ?? []).map(
					(r) => new ChoiceContent(r),
				),
			),
		);
	}
}

@injectable()
class TalkThreadHandler implements SlashCommandHandler {
	isHandle(commandName: string): boolean {
		return commandName === "talk";
	}

	isTextChannel(channel: unknown): channel is TextChannel {
		return (channel as TextChannel).threads !== undefined;
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		const title = interaction.options?.getString("title");
		if (interaction.channel == null) {
			return;
		}
		if (title == null) {
			await interaction.reply("titleパラメーターがないよ！っ");
			return;
		}
		if (!this.isTextChannel(interaction.channel)) {
			return;
		}

		await interaction.reply("以下にお話する場を用意したよ！っ");
		await interaction.channel.threads.create({
			name: title,
			autoArchiveDuration: 60,
		});
	}
}
