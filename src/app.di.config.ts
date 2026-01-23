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
	ParrotCommandHandler,
	ReminderDeleteCommandHandler,
	ReminderListCommandHandler,
	ReminderSetCommandHandler,
	ReviewGachaCommandHandler,
	ReviewListCommandHandler,
	RoomAddChannelCreateCommandHandler,
	RoomAddChannelDeleteCommandHandler,
	RoomNotificationChannelCreateCommandHandler,
	RoomNotificationChannelDeleteCommandHandler,
	StickyCreateCommandHandler,
	StickyDeleteCommandHandler,
	StickyListCommandHandler,
	StickyUpdateCommandHandler,
	TalkCommandHandler,
	TranslateCommandHandler,
	WaiwaiCommandHandler,
} from "@/src/handlers/discord.js/commands/";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import { AIReplyHandler } from "@/src/handlers/discord.js/events/AIReplyHandler";
import { ActionAddBotHandler } from "@/src/handlers/discord.js/events/ActionAddBotHandler";
import { ActionAddUserHandler } from "@/src/handlers/discord.js/events/ActionAddUserHandler";
import { ActionRemoveBotHandler } from "@/src/handlers/discord.js/events/ActionRemoveBotHandler";
import { ActionRemoveUserHandler } from "@/src/handlers/discord.js/events/ActionRemoveUserHandler";
import { CandyReactionHandler } from "@/src/handlers/discord.js/events/CandyReactionHandler";
import { ChannelCreateHandler } from "@/src/handlers/discord.js/events/ChannelCreateHandler";
import { ChannelDeleteHandler } from "@/src/handlers/discord.js/events/ChannelDeleteHandler";
import { CrownReactionHandler } from "@/src/handlers/discord.js/events/CrownReactionHandler";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ReactionInteraction } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import { StickyEventHandler } from "@/src/handlers/discord.js/events/StickyEventHandler";
import { TranslateReplyHandler } from "@/src/handlers/discord.js/events/TranslateReplyHandler";
import { VoiceChannelConnectHandler } from "@/src/handlers/discord.js/events/VoiceChannelConnectHandler";
import { VoiceChannelDisconnectHandler } from "@/src/handlers/discord.js/events/VoiceChannelDisconnectHandler";
import type { VoiceChannelEventHandler, VoiceChannelState } from "@/src/handlers/discord.js/events/VoiceChannelEventHandler";
import { CandyLogic } from "@/src/logics/CandyLogic";
import { ChannelLogic } from "@/src/logics/ChannelLogic";
import { ChatAILogic } from "@/src/logics/ChatAILogic";
import { CommunityLogic } from "@/src/logics/CommunityLogic";
import { ContextLogic } from "@/src/logics/ContextLogic";
import { CrownLogic } from "@/src/logics/CrownLogic";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IContextLogic } from "@/src/logics/Interfaces/logics/IContextLogic";
import type { ICrownLogic } from "@/src/logics/Interfaces/logics/ICrownLogic";
import type { IPersonalityContextLogic } from "@/src/logics/Interfaces/logics/IPersonalityContextLogic";
import type { IPersonalityLogic } from "@/src/logics/Interfaces/logics/IPersonalityLogic";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { IRoomAddChannelLogic } from "@/src/logics/Interfaces/logics/IRoomAddChannelLogic";
import type { IRoomChannelLogic } from "@/src/logics/Interfaces/logics/IRoomChannelLogic";
import type { IRoomNotificationChannelLogic } from "@/src/logics/Interfaces/logics/IRoomNotificationChannelLogic";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import type { ITranslatorLogic } from "@/src/logics/Interfaces/logics/ITranslatorLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type { IChatAIRepository } from "@/src/logics/Interfaces/repositories/chataiapi/IChatAIRepository";
import type { ICandyItemRepository } from "@/src/logics/Interfaces/repositories/database/ICandyItemRepository";
import type { ICandyRepository } from "@/src/logics/Interfaces/repositories/database/ICandyRepository";
import type { IChannelRepository } from "@/src/logics/Interfaces/repositories/database/IChannelRepository";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { IContextRepository } from "@/src/logics/Interfaces/repositories/database/IContextRepository";
import type { ICrownRepository } from "@/src/logics/Interfaces/repositories/database/ICrownRepository";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import type { IPersonalityContextRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityContextRepository";
import type { IPersonalityRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityRepository";
import type { IReminderRepository } from "@/src/logics/Interfaces/repositories/database/IReminderRepository";
import type { IRoomAddChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomAddChannelRepository";
import type { IRoomChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomChannelRepository";
import type { IRoomNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomNotificationChannelRepository";
import type { IStickyRepository } from "@/src/logics/Interfaces/repositories/database/IStickyRepository";
import type { IThreadRepository } from "@/src/logics/Interfaces/repositories/database/IThreadRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IUserCandyItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserCandyItemRepository";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
import type { IPullRequestRepository } from "@/src/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { IMutex } from "@/src/logics/Interfaces/repositories/mutex/IMutex";
import type { ITranslatorRepository } from "@/src/logics/Interfaces/repositories/translator/ITranslatorRepository";
import { PersonalityContextLogic } from "@/src/logics/PersonalityContextLogic";
import { PersonalityLogic } from "@/src/logics/PersonalityLogic";
import { PullRequestLogic } from "@/src/logics/PullRequestLogic";
import { ReminderLogic } from "@/src/logics/ReminderLogic";
import { RoomAddChannelLogic } from "@/src/logics/RoomAddChannelLogic";
import { RoomChannelLogic } from "@/src/logics/RoomChannelLogic";
import { RoomNotificationChannelLogic } from "@/src/logics/RoomNotificationChannelLogic";
import { StickyLogic } from "@/src/logics/StickyLogic";
import { ThreadLogic } from "@/src/logics/ThreadLogic";
import { TranslatorLogic } from "@/src/logics/TranslatorLogic";
import { UserLogic } from "@/src/logics/UserLogic";
import { UtilityLogic } from "@/src/logics/UtilityLogic";
import { ChatGPTRepositoryImpl } from "@/src/repositories/chatgptapi/ChatGPTRepositoryImpl";
import { DeepLTranslateRepositoryImpl } from "@/src/repositories/deeplapi/DeepLTranslateRepositoryImpl";
import { GithubPullRequestRepositoryImpl } from "@/src/repositories/githubapi/GithubPullRequestRepositoryImpl";
import { PinoLogger } from "@/src/repositories/logger/PinoLogger";
import { AwaitSemaphoreMutex } from "@/src/repositories/mutex/AwaitSemaphoreMutex";
import {
	CandyItemRepositoryImpl,
	CandyRepositoryImpl,
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
	ContextRepositoryImpl,
	CrownRepositoryImpl,
	DataDeletionCircularImpl,
	PersonalityContextRepositoryImpl,
	PersonalityRepositoryImpl,
	ReminderRepositoryImpl,
	RoomAddChannelRepositoryImpl,
	RoomChannelRepositoryImpl,
	RoomNotificationChannelRepositoryImpl,
	StickyRepositoryImpl,
	ThreadRepositoryImpl,
	UserCandyItemRepositoryImpl,
	UserRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { SequelizeTransaction } from "@/src/repositories/sequelize-mysql/SequelizeTransaction";
import { ActionAddBotRouter } from "@/src/routes/discordjs/events/ActionAddBotRouter";
import { ActionAddChannelRouter } from "@/src/routes/discordjs/events/ActionAddChannelRouter";
import { ActionAddUserRouter } from "@/src/routes/discordjs/events/ActionAddUserRouter";
import { ActionRemoveBotRouter } from "@/src/routes/discordjs/events/ActionRemoveBotRouter";
import { ActionRemoveChannelRouter } from "@/src/routes/discordjs/events/ActionRemoveChannelRoute";
import { ActionRemoveUserRouter } from "@/src/routes/discordjs/events/ActionRemoveUserRouter";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import { MessageReplyRouter } from "@/src/routes/discordjs/events/MessageReplyRouter";
import { ReactionRouter } from "@/src/routes/discordjs/events/ReactionRouter";
import { ReadyStateRouter } from "@/src/routes/discordjs/events/ReadyStateRouter";
import { SlashCommandRouter } from "@/src/routes/discordjs/events/SlashCommandRouter";
import { VoiceChannelEventRouter } from "@/src/routes/discordjs/events/VoiceChannelEventRouter";
import type { DMChannel, Guild, GuildChannel, GuildMember, Message } from "discord.js";
import { Container } from "inversify";
import type { Sequelize } from "sequelize";
import { DiceLogic } from "./logics/DiceLogic";
import type { IDiceLogic } from "./logics/Interfaces/logics/IDiceLogic";
const appContainer = new Container();

// Repositories
// Mutex
appContainer.bind<IMutex>(RepoTypes.Mutex).to(AwaitSemaphoreMutex).inSingletonScope();

// Database
appContainer.bind<IDataBaseConnector<Sequelize, "mysql">>(RepoTypes.DatabaseConnector).to(MysqlConnector).inSingletonScope();
appContainer.bind<ITransaction>(RepoTypes.Transaction).to(SequelizeTransaction);
appContainer.bind<ICandyRepository>(RepoTypes.CandyRepository).to(CandyRepositoryImpl);
appContainer.bind<ICrownRepository>(RepoTypes.CrownRepository).to(CrownRepositoryImpl);
appContainer.bind<ICandyItemRepository>(RepoTypes.CandyItemRepository).to(CandyItemRepositoryImpl);
appContainer.bind<IUserCandyItemRepository>(RepoTypes.UserCandyItemRepository).to(UserCandyItemRepositoryImpl);
appContainer.bind<IReminderRepository>(RepoTypes.ReminderRepository).to(ReminderRepositoryImpl);
appContainer.bind<IThreadRepository>(RepoTypes.ThreadRepository).to(ThreadRepositoryImpl);
appContainer.bind<IPersonalityRepository>(RepoTypes.PersonalityRepository).to(PersonalityRepositoryImpl);
appContainer.bind<IContextRepository>(RepoTypes.ContextRepository).to(ContextRepositoryImpl);
appContainer.bind<IPersonalityContextRepository>(RepoTypes.PersonalityContextRepository).to(PersonalityContextRepositoryImpl);
appContainer.bind<IRoomAddChannelRepository>(RepoTypes.RoomAddChannelRepository).to(RoomAddChannelRepositoryImpl);
appContainer.bind<IRoomChannelRepository>(RepoTypes.RoomChannelRepository).to(RoomChannelRepositoryImpl);
appContainer.bind<IRoomNotificationChannelRepository>(RepoTypes.RoomNotificationChannelRepository).to(RoomNotificationChannelRepositoryImpl);
appContainer.bind<IStickyRepository>(RepoTypes.StickyRepository).to(StickyRepositoryImpl);
appContainer.bind<ICommunityRepository>(RepoTypes.CommunityRepository).to(CommunityRepositoryImpl);
appContainer.bind<IUserRepository>(RepoTypes.UserRepository).to(UserRepositoryImpl);
appContainer.bind<IChannelRepository>(RepoTypes.ChannelRepository).to(ChannelRepositoryImpl);
appContainer.bind<IDataDeletionCircular>(RepoTypes.DataDeletionCircular).to(DataDeletionCircularImpl);
// ChatGPT
appContainer.bind<IChatAIRepository>(RepoTypes.ChatAIRepository).to(ChatGPTRepositoryImpl);
// DeepL
appContainer.bind<ITranslatorRepository>(RepoTypes.TranslateRepository).to(DeepLTranslateRepositoryImpl);
// Github
appContainer.bind<IPullRequestRepository>(RepoTypes.PullRequestRepository).to(GithubPullRequestRepositoryImpl).inSingletonScope();
// Logger
appContainer.bind<ILogger>(RepoTypes.Logger).to(PinoLogger);

// Logics
appContainer.bind<IThreadLogic>(LogicTypes.ThreadLogic).to(ThreadLogic);
appContainer.bind<IPersonalityLogic>(LogicTypes.PersonalityLogic).to(PersonalityLogic);
appContainer.bind<IContextLogic>(LogicTypes.ContextLogic).to(ContextLogic);
appContainer.bind<IPersonalityContextLogic>(LogicTypes.PersonalityContextLogic).to(PersonalityContextLogic);
appContainer.bind<IChatAILogic>(LogicTypes.ChatAILogic).to(ChatAILogic);
appContainer.bind<ICandyLogic>(LogicTypes.CandyLogic).to(CandyLogic);
appContainer.bind<ICrownLogic>(LogicTypes.CrownLogic).to(CrownLogic);
appContainer.bind<IReminderLogic>(LogicTypes.ReminderLogic).to(ReminderLogic);
appContainer.bind<IPullRequestLogic>(LogicTypes.PullRequestLogic).to(PullRequestLogic);
appContainer.bind<ITranslatorLogic>(LogicTypes.TranslatorLogic).to(TranslatorLogic);
appContainer.bind<IDiceLogic>(LogicTypes.DiceLogic).to(DiceLogic);
appContainer.bind<IStickyLogic>(LogicTypes.StickyLogic).to(StickyLogic);
appContainer.bind<IRoomAddChannelLogic>(LogicTypes.RoomAddChannelLogic).to(RoomAddChannelLogic);
appContainer.bind<IRoomChannelLogic>(LogicTypes.RoomChannelLogic).to(RoomChannelLogic);
appContainer.bind<IRoomNotificationChannelLogic>(LogicTypes.RoomNotificationChannelLogic).to(RoomNotificationChannelLogic);
appContainer.bind<IUtilityLogic>(LogicTypes.UtilityLogic).to(UtilityLogic);
appContainer.bind<ICommunityLogic>(LogicTypes.CommunityLogic).to(CommunityLogic);
appContainer.bind<IUserLogic>(LogicTypes.UserLogic).to(UserLogic);
appContainer.bind<IChannelLogic>(LogicTypes.ChannelLogic).to(ChannelLogic);

// Handlers
appContainer.bind<DiscordEventHandler<Message>>(HandlerTypes.MessageHandler).to(AIReplyHandler);
appContainer.bind<DiscordEventHandler<Message>>(HandlerTypes.MessageHandler).to(StickyEventHandler);
appContainer.bind<DiscordEventHandler<Message>>(HandlerTypes.MessageHandler).to(TranslateReplyHandler);
appContainer.bind<DiscordEventHandler<ReactionInteraction>>(HandlerTypes.ReactionHandler).to(CandyReactionHandler);
appContainer.bind<DiscordEventHandler<Guild>>(HandlerTypes.ActionAddBotHandler).to(ActionAddBotHandler);
appContainer.bind<DiscordEventHandler<Guild>>(HandlerTypes.ActionRemoveBotHandler).to(ActionRemoveBotHandler);
appContainer.bind<DiscordEventHandler<GuildMember>>(HandlerTypes.ActionAddUserHandler).to(ActionAddUserHandler);
appContainer.bind<DiscordEventHandler<GuildMember>>(HandlerTypes.ActionRemoveUserHandler).to(ActionRemoveUserHandler);
appContainer.bind<DiscordEventHandler<GuildChannel>>(HandlerTypes.ActionAddChannelHandler).to(ChannelCreateHandler);
appContainer.bind<DiscordEventHandler<GuildChannel | DMChannel>>(HandlerTypes.ActionRemoveChannelHandler).to(ChannelDeleteHandler);
appContainer.bind<DiscordEventHandler<ReactionInteraction>>(HandlerTypes.ReactionHandler).to(CrownReactionHandler);
appContainer.bind<VoiceChannelEventHandler<VoiceChannelState>>(HandlerTypes.VoiceChannelEventHandler).to(VoiceChannelConnectHandler);
appContainer.bind<VoiceChannelEventHandler<VoiceChannelState>>(HandlerTypes.VoiceChannelEventHandler).to(VoiceChannelDisconnectHandler);
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
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(StickyCreateCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(StickyDeleteCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(StickyUpdateCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(StickyListCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(RoomAddChannelCreateCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(RoomAddChannelDeleteCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(RoomNotificationChannelCreateCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(RoomNotificationChannelDeleteCommandHandler);

// Routes
appContainer.bind<DiscordEventRouter>(RouteTypes.SlashCommandRoute).to(SlashCommandRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.MessageReplyRoute).to(MessageReplyRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ReadyStateRoute).to(ReadyStateRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ReactionRoute).to(ReactionRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ActionAddBotRoute).to(ActionAddBotRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ActionRemoveBotRoute).to(ActionRemoveBotRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ActionAddUserRoute).to(ActionAddUserRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ActionRemoveUserRoute).to(ActionRemoveUserRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ActionAddChannelRoute).to(ActionAddChannelRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ActionRemoveChannelRoute).to(ActionRemoveChannelRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.VoiceChannelEventRoute).to(VoiceChannelEventRouter);
export { appContainer };
