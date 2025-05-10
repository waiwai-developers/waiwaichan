import { LogicTypes, RepoTypes, RouteTypes } from "@/src/entities/constants/DIContainerTypes";
import { HandlerTypes } from "@/src/entities/constants/DIContainerTypes";
import {
	CandyBoxDrawCommandHandler,
	CandyCheckCommandHandler,
	CandyDrawCommandHandler,
	CandyExchangeCommandHandler,
	CandyItemCommandHandler,
	ChoiceCommandHandler,
	DiceCommandHandler,
	HelpCommandHandler,
	MinecraftStartCommandHandler,
	MinecraftStopCommandHandler,
	ParrotCommandHandler,
	ReminderDeleteCommandHandler,
	ReminderListCommandHandler,
	ReminderSetCommandHandler,
	ReviewGachaCommandHandler,
	ReviewListCommandHandler,
	StickyCreateCommandHandler,
	StickyDeleteCommandHandler,
	TalkCommandHandler,
	TranslateCommandHandler,
	WaiwaiCommandHandler,
} from "@/src/handlers/discord.js/commands/";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import { AIReplyHandler } from "@/src/handlers/discord.js/events/AIReplyHandler";
import { ActionAddBotHandler } from "@/src/handlers/discord.js/events/ActionAddBotHandler";
import { CandyReactionHandler } from "@/src/handlers/discord.js/events/CandyReactionHandler";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ReactionInteraction } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import { StickyEventHandler } from "@/src/handlers/discord.js/events/StickyEventHandler";
import { TranslateReplyHandler } from "@/src/handlers/discord.js/events/TranslateReplyHandler";
import { CandyLogic } from "@/src/logics/CandyLogic";
import { ChatAILogic } from "@/src/logics/ChatAILogic";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { IMinecraftServerLogic } from "@/src/logics/Interfaces/logics/IMinecraftServerLogic";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import type { ITranslatorLogic } from "@/src/logics/Interfaces/logics/ITranslatorLogic";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type { IChatAIRepository } from "@/src/logics/Interfaces/repositories/chataiapi/IChatAIRepository";
import type { IVirtualMachineAPI } from "@/src/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";
import type { ICandyItemRepository } from "@/src/logics/Interfaces/repositories/database/ICandyItemRepository";
import type { ICandyRepository } from "@/src/logics/Interfaces/repositories/database/ICandyRepository";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { IReminderRepository } from "@/src/logics/Interfaces/repositories/database/IReminderRepository";
import type { IStickyRepository } from "@/src/logics/Interfaces/repositories/database/IStickyRepository.ts";
import type { IThreadRepository } from "@/src/logics/Interfaces/repositories/database/IThreadRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IUserCandyItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserCandyItemRepository";
import type { IPullRequestRepository } from "@/src/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { IMutex } from "@/src/logics/Interfaces/repositories/mutex/IMutex";
import type { ITranslatorRepository } from "@/src/logics/Interfaces/repositories/translator/ITranslatorRepository";
import { MinecraftServerLogic } from "@/src/logics/MinecraftServerLogic";
import { PullRequestLogic } from "@/src/logics/PullRequestLogic";
import { ReminderLogic } from "@/src/logics/ReminderLogic";
import { StickyLogic } from "@/src/logics/StickyLogic";
import { ThreadLogic } from "@/src/logics/ThreadLogic";
import { TranslatorLogic } from "@/src/logics/TranslatorLogic";
import { UtilityLogic } from "@/src/logics/UtilityLogic";
import { ChatGPTRepositoryImpl } from "@/src/repositories/chatgptapi/ChatGPTRepositoryImpl";
import { DeepLTranslateRepositoryImpl } from "@/src/repositories/deeplapi/DeepLTranslateRepositoryImpl";
import { GCPComputeEngineInstanceRepositoryImpl } from "@/src/repositories/gcpapi/GCPComputeEngineInstanceRepositoryImpl";
import { GithubPullRequestRepositoryImpl } from "@/src/repositories/githubapi/GithubPullRequestRepositoryImpl";
import { PinoLogger } from "@/src/repositories/logger/PinoLogger";
import { AwaitSemaphoreMutex } from "@/src/repositories/mutex/AwaitSemaphoreMutex";
import { CandyItemRepositoryImpl, CandyRepositoryImpl, ReminderRepositoryImpl, StickyRepositoryImpl, ThreadRepositoryImpl, UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { SequelizeTransaction } from "@/src/repositories/sequelize-mysql/SequelizeTransaction";
import { ActionAddBotRouter } from "@/src/routes/discordjs/events/ActionAddBotRouter";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import { MessageReplyRouter } from "@/src/routes/discordjs/events/MessageReplyRouter";
import { ReactionRouter } from "@/src/routes/discordjs/events/ReactionRouter";
import { ReadyStateRouter } from "@/src/routes/discordjs/events/ReadyStateRouter";
import { SlashCommandRouter } from "@/src/routes/discordjs/events/SlashCommandRouter";
import type { Message, Guild } from "discord.js";
import { Container } from "inversify";
import type { Sequelize } from "sequelize";

// for app
const appContainer = new Container();

// Repositories
// Mutex
appContainer.bind<IMutex>(RepoTypes.Mutex).to(AwaitSemaphoreMutex).inSingletonScope();

// Database
appContainer.bind<IDataBaseConnector<Sequelize, "mysql">>(RepoTypes.DatabaseConnector).to(MysqlConnector).inSingletonScope();
appContainer.bind<ITransaction>(RepoTypes.Transaction).to(SequelizeTransaction);
appContainer.bind<ICandyRepository>(RepoTypes.CandyRepository).to(CandyRepositoryImpl);
appContainer.bind<ICandyItemRepository>(RepoTypes.CandyItemRepository).to(CandyItemRepositoryImpl);
appContainer.bind<IUserCandyItemRepository>(RepoTypes.UserCandyItemRepository).to(UserCandyItemRepositoryImpl);
appContainer.bind<IReminderRepository>(RepoTypes.ReminderRepository).to(ReminderRepositoryImpl);
appContainer.bind<IThreadRepository>(RepoTypes.ThreadRepository).to(ThreadRepositoryImpl);
appContainer.bind<IStickyRepository>(RepoTypes.StickyRepository).to(StickyRepositoryImpl);
// ChatGPT
appContainer.bind<IChatAIRepository>(RepoTypes.ChatAIRepository).to(ChatGPTRepositoryImpl);
// DeepL
appContainer.bind<ITranslatorRepository>(RepoTypes.TranslateRepository).to(DeepLTranslateRepositoryImpl);
// GCP
appContainer.bind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository).to(GCPComputeEngineInstanceRepositoryImpl);
// Github
appContainer.bind<IPullRequestRepository>(RepoTypes.PullRequestRepository).to(GithubPullRequestRepositoryImpl).inSingletonScope();
// Logger
appContainer.bind<ILogger>(RepoTypes.Logger).to(PinoLogger);

// Logics
appContainer.bind<IThreadLogic>(LogicTypes.ThreadLogic).to(ThreadLogic);
appContainer.bind<IChatAILogic>(LogicTypes.ChatAILogic).to(ChatAILogic);
appContainer.bind<IMinecraftServerLogic>(LogicTypes.MinecraftServerLogic).to(MinecraftServerLogic);
appContainer.bind<ICandyLogic>(LogicTypes.CandyLogic).to(CandyLogic);
appContainer.bind<IReminderLogic>(LogicTypes.ReminderLogic).to(ReminderLogic);
appContainer.bind<IPullRequestLogic>(LogicTypes.PullRequestLogic).to(PullRequestLogic);
appContainer.bind<ITranslatorLogic>(LogicTypes.TranslatorLogic).to(TranslatorLogic);
appContainer.bind<IStickyLogic>(LogicTypes.StickyLogic).to(StickyLogic);
appContainer.bind<IUtilityLogic>(LogicTypes.UtilityLogic).to(UtilityLogic);

// Handlers
appContainer.bind<DiscordEventHandler<Message>>(HandlerTypes.MessageHandler).to(AIReplyHandler);
appContainer.bind<DiscordEventHandler<Message>>(HandlerTypes.MessageHandler).to(StickyEventHandler);
appContainer.bind<DiscordEventHandler<Message>>(HandlerTypes.MessageHandler).to(TranslateReplyHandler);
appContainer.bind<DiscordEventHandler<ReactionInteraction>>(HandlerTypes.ReactionHandler).to(CandyReactionHandler);
appContainer.bind<DiscordEventHandler<Guild>>(HandlerTypes.ActionAddBotHandler).to(ActionAddBotHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(HelpCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(WaiwaiCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(ParrotCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(DiceCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(ChoiceCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(TranslateCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(TalkCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(ReminderSetCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(ReminderListCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(ReminderDeleteCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CandyCheckCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CandyDrawCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CandyBoxDrawCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CandyItemCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CandyExchangeCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(ReviewGachaCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(ReviewListCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(MinecraftStartCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(MinecraftStopCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(StickyCreateCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(StickyDeleteCommandHandler);

// Routes
appContainer.bind<DiscordEventRouter>(RouteTypes.SlashCommandRoute).to(SlashCommandRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.MessageReplyRoute).to(MessageReplyRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ReadyStateRoute).to(ReadyStateRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ReactionRoute).to(ReactionRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ActionAddBotRoute).to(ActionAddBotRouter);

export { appContainer };
