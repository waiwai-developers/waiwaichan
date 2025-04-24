import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { SlashCommandHandler } from "./SlashCommandHandler";
import { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import { IDiceLogic } from "@/src/logics/Interfaces/logics/IDiceLogic";
import { DiceExpression } from "@/src/entities/vo/DiceExpression";

@injectable()
export class Dice2CommandHandler implements SlashCommandHandler {
    @inject(LogicTypes.DiceLogic)
    private diceLogic!: IDiceLogic;

    isHandle(commandName: string): boolean {
        return commandName === "dice2";
    }

    async handle(interaction: ChatInputCommandInteraction<CacheType>): Promise<void> {
        await interaction.reply({
            embeds: [
                await this.diceLogic.dice2(
                    new DiceExpression(
                        {
                            source: interaction.options?.getString("source", true),
                            isSecret: !!interaction.options?.getBoolean("secret", false),
                            showDetails: !!interaction.options?.getBoolean("details", false),
                            user: interaction.user,
                        }
                    )
                )
            ]
        });
    }
}