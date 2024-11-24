import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { TranslateDto } from "@/src/entities/dto/TranslateDto";
import { ChoiceContent } from "@/src/entities/vo/ChoiceContent";
import { DiceSides } from "@/src/entities/vo/DiceSides";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { GithubPullRequestId } from "@/src/entities/vo/GithubPullRequestId";
import { HelpCategory } from "@/src/entities/vo/HelpCategory";
import { ParrotMessage } from "@/src/entities/vo/ParrotMessage";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import { TranslateSourceLanguage } from "@/src/entities/vo/TranslateSourceLanguage";
import { TranslateTargetLanguage } from "@/src/entities/vo/TranslateTargetLanguage";
import { TranslateText } from "@/src/entities/vo/TranslateText";
import { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { IMinecraftServerLogic } from "@/src/logics/Interfaces/logics/IMinecraftServerLogic";
import type { IPointLogic } from "@/src/logics/Interfaces/logics/IPointLogic";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { ITranslatorLogic } from "@/src/logics/Interfaces/logics/ITranslatorLogic";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import dayjs from "dayjs";
import type { Client, TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class SlashCommandRouter implements DiscordEventRouter {
	@inject(LogicTypes.ChatAILogic)
	private chatAILogic!: IChatAILogic;

	@inject(LogicTypes.ReminderLogic)
	private reminderLogic!: IReminderLogic;

	@inject(LogicTypes.PointLogic)
	private pointLogic!: IPointLogic;

	@inject(LogicTypes.PullRequestLogic)
	private pullRequestLogic!: IPullRequestLogic;

	@inject(LogicTypes.MinecraftServerLogic)
	private mineCraftLogic!: IMinecraftServerLogic;

	register(client: Client<boolean>): void {
		client.on("interactionCreate", async (interaction) => {
			try {
				if (!interaction.isChatInputCommand()) return;
				switch (interaction.commandName) {
					case "reminderset":
						await interaction.reply(
							await this.reminderLogic.create(
								new ReminderDto(
									new ReminderId(0),
									new DiscordChannelId(interaction.channelId),
									new DiscordUserId(interaction.user.id),
									new ReminderMessage(
										interaction.options.getString("message") ?? "",
									),
									new RemindTime(
										dayjs(interaction.options.getString("datetime"))
											.subtract(9, "h")
											.toDate(),
									),
								),
							),
						);
						break;
					case "reminderdelete":
						await interaction.reply(
							await this.reminderLogic.delete(
								new ReminderId(interaction.options?.getInteger("id") ?? 0),
								new DiscordUserId(interaction.user.id),
							),
						);
						break;
					case "reminderlist":
						await interaction.reply(
							await this.reminderLogic.list(
								new DiscordUserId(interaction.user.id),
							),
						);
						break;
					case "pointcheck":
						await interaction.reply(
							await this.pointLogic.check(
								new DiscordUserId(interaction.user.id),
							),
						);

						break;
					case "pointdraw":
						await interaction.reply(
							await this.pointLogic.drawItem(
								new DiscordUserId(interaction.user.id),
							),
						);
						break;
					case "pointitem":
						await interaction.reply(
							await this.pointLogic.getItems(
								new DiscordUserId(interaction.user.id),
							),
						);
						break;
					case "pointchange":
						await interaction.reply(
							await this.pointLogic.exchange(
								new DiscordUserId(interaction.user.id),
								new UserPointItemId(interaction.options.getInteger("id") ?? 0),
							),
						);
						break;
					case "reviewgacha":
						await interaction.deferReply();
						await interaction.editReply(
							await this.pullRequestLogic.randomAssign(
								new GithubPullRequestId(
									interaction.options?.getInteger("id") ?? 0,
								),
								new DiscordUserId(interaction.user.id),
							),
						);
						break;
					case "reviewlist":
						await interaction.deferReply();
						await interaction.editReply(
							await this.pullRequestLogic.findAssignedPullRequest(
								new DiscordUserId(interaction.user.id),
							),
						);
						break;
					case "minecraftstart":
						await interaction.deferReply();
						await interaction.editReply(
							await this.mineCraftLogic.startServer(),
						);
						break;
					case "minecraftstop":
						await interaction.deferReply();
						await interaction.editReply(await this.mineCraftLogic.stopServer());
						break;
					default:
						await interaction.reply("そんなコマンドはないよ！っ");
				}
			} catch (error) {
				console.log(error);
			}
		});
	}
}
