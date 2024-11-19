import { ReminderDto } from "@/entities/dto/ReminderDto";
import { TranslateDto } from "@/entities/dto/TranslateDto";
import { ChoiceContent } from "@/entities/vo/ChoiceContent";
import { DiceSides } from "@/entities/vo/DiceSides";
import { DiscordChannelId } from "@/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/entities/vo/DiscordUserId";
import { GithubPullRequestId } from "@/entities/vo/GithubPullRequestId";
import { HelpCategory } from "@/entities/vo/HelpCategory";
import { ParrotMessage } from "@/entities/vo/ParrotMessage";
import { RemindTime } from "@/entities/vo/RemindTime";
import { ReminderId } from "@/entities/vo/ReminderId";
import { ReminderMessage } from "@/entities/vo/ReminderMessage";
import { TranslateSourceLanguage } from "@/entities/vo/TranslateSourceLanguage";
import { TranslateTargetLanguage } from "@/entities/vo/TranslateTargetLanguage";
import { TranslateText } from "@/entities/vo/TranslateText";
import { UserPointItemId } from "@/entities/vo/UserPointItemId";
import type { IChatAILogic } from "@/logics/Interfaces/logics/IChatAILogic";
import type { IMinecraftServerLogic } from "@/logics/Interfaces/logics/IMinecraftServerLogic";
import type { IPointLogic } from "@/logics/Interfaces/logics/IPointLogic";
import type { IPullRequestLogic } from "@/logics/Interfaces/logics/IPullRequestLogic";
import type { IReminderLogic } from "@/logics/Interfaces/logics/IReminderLogic";
import type { ITranslatorLogic } from "@/logics/Interfaces/logics/ITranslatorLogic";
import type { IUtilityLogic } from "@/logics/Interfaces/logics/IUtilityLogic";
import type { DiscordEventRouter } from "@/routes/discordjs/events/DiscordEventRouter";
import dayjs from "dayjs";
import type { Client, TextChannel } from "discord.js";

export class SlashCommandRouter implements DiscordEventRouter {
	constructor(
		private utilLogic: IUtilityLogic,
		private translateLogic: ITranslatorLogic,
		private chatAILogic: IChatAILogic,
		private reminderLogic: IReminderLogic,
		private pointLogic: IPointLogic,
		private pullRequestLogic: IPullRequestLogic,
		private mineCraftLogic: IMinecraftServerLogic,
	) {}
	register(client: Client<boolean>): void {
		client.on("interactionCreate", async (interaction) => {
			try {
				if (!interaction.isChatInputCommand()) return;
				switch (interaction.commandName) {
					case "help":
						await interaction.reply(
							await this.utilLogic.help(
								new HelpCategory(
									interaction.options?.getString("category") ?? "",
								),
							),
						);
						break;
					case "waiwai":
						await interaction.reply(await this.utilLogic.waiwai());
						break;
					case "parrot":
						await interaction.reply(
							await this.utilLogic.parrot(
								new ParrotMessage(
									interaction.options?.getString("message") ?? "",
								),
							),
						);
						break;
					case "dice":
						await interaction.reply(
							await this.utilLogic.dice(
								new DiceSides(
									interaction.options?.getInteger("parameter") ?? 0,
								),
							),
						);
						break;
					case "choice":
						await interaction.reply(
							await this.utilLogic.choice(
								(interaction.options?.getString("items")?.split(" ") ?? []).map(
									(r) => new ChoiceContent(r),
								),
							),
						);
						break;
					case "translate": {
						await interaction.deferReply();
						const dto = new TranslateDto(
							new TranslateText(
								interaction.options?.getString("messages") ?? "",
							),
							new TranslateSourceLanguage(
								interaction.options?.getString("source") ?? "",
							),
							new TranslateTargetLanguage(
								interaction.options?.getString("target") ?? "",
							),
						);
						await interaction.editReply(
							await this.translateLogic.translate(dto),
						);
						break;
					}
					case "talk": {
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
						break;
					}
					case "reminderset":
						await interaction.reply(
							await this.reminderLogic.create(
								new ReminderDto(
									new ReminderId(0),
									new DiscordUserId(interaction.user.id),
									new DiscordChannelId(interaction.channelId),
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
	isTextChannel(channel: unknown): channel is TextChannel {
		return (channel as TextChannel).threads !== undefined;
	}
}
