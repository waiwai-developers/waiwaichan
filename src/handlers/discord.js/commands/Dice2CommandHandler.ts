import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { SlashCommandHandler } from "./SlashCommandHandler";
import { CacheType, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
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
        const [source, isSecret] = await this.diceLogic.dice2(
            new DiceExpression({
                source: interaction.options?.getString("source", true),
                isSecret: !!interaction.options?.getBoolean("secret", false),
            }),
        );
        let embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('dice2')
            .setDescription(source)
            .setFooter({ text: 'フッターテスト' });
        if (isSecret) {
            const user = interaction.user;
            await user.send({ embeds: [embed] });
            embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setTitle('dice2')
                .setDescription('秘密だよ💗')
            ;
        }
        await interaction.reply({ embeds: [embed] });
    }
}