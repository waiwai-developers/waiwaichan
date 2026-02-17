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
	RoomCategoryChannelCreateCommandHandler,
	RoomCategoryChannelDeleteCommandHandler,
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
import { CandyNotificationChannelCreateCommandHandler } from "@/src/handlers/discord.js/commands/CandyNotificationChannelCreateCommandHandler";
import { CandyNotificationChannelDeleteCommandHandler } from "@/src/handlers/discord.js/commands/CandyNotificationChannelDeleteCommandHandler";
import { CrownNotificationChannelCreateCommandHandler } from "@/src/handlers/discord.js/commands/CrownNotificationChannelCreateCommandHandler";
import { CrownNotificationChannelDeleteCommandHandler } from "@/src/handlers/discord.js/commands/CrownNotificationChannelDeleteCommandHandler";
import { CustomRoleBindToggleByCommandHandler } from "@/src/handlers/discord.js/commands/CustomRoleBindToggleByCommandHandler";
import { CustomRoleCreateHandler } from "@/src/handlers/discord.js/commands/CustomRoleCreateHandler";
import { CustomRoleDeleteHandler } from "@/src/handlers/discord.js/commands/CustomRoleDeleteHandler";
import { RoleBindToggleByCustomRoleHandler } from "@/src/handlers/discord.js/commands/RoleBindToggleByCustomRoleHandler";
import { RoleBindedByPredefinedRoleCommandHandler } from "@/src/handlers/discord.js/commands/RoleBindedByPredefinedRoleCommandHandler";
import { RoleReleasedByPredefinedRoleCommandHandler } from "@/src/handlers/discord.js/commands/RoleReleasedByPredefinedRoleCommandHandler";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import { AIReplyHandler } from "@/src/handlers/discord.js/events/AIReplyHandler";
import { BotAddHandler } from "@/src/handlers/discord.js/events/BotAddHandler";
import { BotRemoveHandler } from "@/src/handlers/discord.js/events/BotRemoveHandler";
import { CandyReactionHandler } from "@/src/handlers/discord.js/events/CandyReactionHandler";
import { ChannelCreateHandler } from "@/src/handlers/discord.js/events/ChannelCreateHandler";
import { ChannelDeleteHandler } from "@/src/handlers/discord.js/events/ChannelDeleteHandler";
import { CrownReactionHandler } from "@/src/handlers/discord.js/events/CrownReactionHandler";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ReactionInteraction } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import { MessageDeleteHandler } from "@/src/handlers/discord.js/events/MessageDeleteHandler";
import { RoleCreateHandler } from "@/src/handlers/discord.js/events/RoleCreateHandler";
import { RoleDeleteHandler } from "@/src/handlers/discord.js/events/RoleDeleteHandler";
import { StickyEventHandler } from "@/src/handlers/discord.js/events/StickyEventHandler";
import { TranslateReplyHandler } from "@/src/handlers/discord.js/events/TranslateReplyHandler";
import { UserAddHandler } from "@/src/handlers/discord.js/events/UserAddHandler";
import { UserRemoveHandler } from "@/src/handlers/discord.js/events/UserRemoveHandler";
import { VoiceChannelConnectHandler } from "@/src/handlers/discord.js/events/VoiceChannelConnectHandler";
import { VoiceChannelDisconnectHandler } from "@/src/handlers/discord.js/events/VoiceChannelDisconnectHandler";
import type { VoiceChannelEventHandler, VoiceChannelState } from "@/src/handlers/discord.js/events/VoiceChannelEventHandler";
import { CommandPermissionChecker } from "@/src/handlers/discord.js/permissions/CommandPermissionChecker";
import type { ICommandPermissionChecker } from "@/src/handlers/discord.js/permissions/ICommandPermissionChecker";
import { CandyLogic } from "@/src/logics/CandyLogic";
import { CandyNotificationChannelLogic } from "@/src/logics/CandyNotificationChannelLogic";
import { ChannelLogic } from "@/src/logics/ChannelLogic";
import { ChatAILogic } from "@/src/logics/ChatAILogic";
import { CommunityLogic } from "@/src/logics/CommunityLogic";
import { ContextLogic } from "@/src/logics/ContextLogic";
import { CrownLogic } from "@/src/logics/CrownLogic";
import { CrownNotificationChannelLogic } from "@/src/logics/CrownNotificationChannelLogic";
import { CustomRoleLogic } from "@/src/logics/CustomRoleLogic";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import type { ICandyNotificationChannelLogic } from "@/src/logics/Interfaces/logics/ICandyNotificationChannelLogic";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IContextLogic } from "@/src/logics/Interfaces/logics/IContextLogic";
import type { ICrownLogic } from "@/src/logics/Interfaces/logics/ICrownLogic";
import type { ICrownNotificationChannelLogic } from "@/src/logics/Interfaces/logics/ICrownNotificationChannelLogic";
import type { ICustomRoleLogic } from "@/src/logics/Interfaces/logics/ICustomRoleLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IPersonalityContextLogic } from "@/src/logics/Interfaces/logics/IPersonalityContextLogic";
import type { IPersonalityLogic } from "@/src/logics/Interfaces/logics/IPersonalityLogic";
import type { IPredefinedRoleLogic } from "@/src/logics/Interfaces/logics/IPredefinedRoleLogic";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { IRoleLogic } from "@/src/logics/Interfaces/logics/IRoleLogic";
import type { IRoomAddChannelLogic } from "@/src/logics/Interfaces/logics/IRoomAddChannelLogic";
import type { IRoomCategoryChannelLogic } from "@/src/logics/Interfaces/logics/IRoomCategoryChannelLogic";
import type { IRoomChannelLogic } from "@/src/logics/Interfaces/logics/IRoomChannelLogic";
import type { IRoomNotificationChannelLogic } from "@/src/logics/Interfaces/logics/IRoomNotificationChannelLogic";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import type { ITranslatorLogic } from "@/src/logics/Interfaces/logics/ITranslatorLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type { IChatAIRepository } from "@/src/logics/Interfaces/repositories/chataiapi/IChatAIRepository";
import type { ICandyItemRepository } from "@/src/logics/Interfaces/repositories/database/ICandyItemRepository";
import type { ICandyNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/ICandyNotificationChannelRepository";
import type { ICandyRepository } from "@/src/logics/Interfaces/repositories/database/ICandyRepository";
import type { IChannelRepository } from "@/src/logics/Interfaces/repositories/database/IChannelRepository";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { IContextRepository } from "@/src/logics/Interfaces/repositories/database/IContextRepository";
import type { ICrownNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/ICrownNotificationChannelRepository";
import type { ICrownRepository } from "@/src/logics/Interfaces/repositories/database/ICrownRepository";
import type { ICustomRoleCommandRepository } from "@/src/logics/Interfaces/repositories/database/ICustomRoleCommandRepository";
import type { ICustomRoleRepository } from "@/src/logics/Interfaces/repositories/database/ICustomRoleRepository";
import type { IDataBaseConnector } from "@/src/logics/Interfaces/repositories/database/IDataBaseConnector";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import type { IMessageRepository } from "@/src/logics/Interfaces/repositories/database/IMessageRepository";
import type { IPersonalityContextRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityContextRepository";
import type { IPersonalityRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityRepository";
import type { IPredefinedRoleCommandRepository } from "@/src/logics/Interfaces/repositories/database/IPredefinedRoleCommandRepository";
import type { IPredefinedRoleRepository } from "@/src/logics/Interfaces/repositories/database/IPredefinedRoleRepository";
import type { IReminderRepository } from "@/src/logics/Interfaces/repositories/database/IReminderRepository";
import type { IRoleCustomRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRoleCustomRoleRepository";
import type { IRolePredefinedRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRolePredefinedRoleRepository";
import type { IRoleRepository } from "@/src/logics/Interfaces/repositories/database/IRoleRepository";
import type { IRoomAddChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomAddChannelRepository";
import type { IRoomCategoryChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomCategoryChannelRepository";
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
import { MessageLogic } from "@/src/logics/MessageLogic";
import { PersonalityContextLogic } from "@/src/logics/PersonalityContextLogic";
import { PersonalityLogic } from "@/src/logics/PersonalityLogic";
import { PredefinedRoleLogic } from "@/src/logics/PredefinedRoleLogic";
import { PullRequestLogic } from "@/src/logics/PullRequestLogic";
import { ReminderLogic } from "@/src/logics/ReminderLogic";
import { RoleLogic } from "@/src/logics/RoleLogic";
import { RoomAddChannelLogic } from "@/src/logics/RoomAddChannelLogic";
import { RoomCategoryChannelLogic } from "@/src/logics/RoomCategoryChannelLogic";
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
	MessageRepositoryImpl,
	PersonalityContextRepositoryImpl,
	PersonalityRepositoryImpl,
	ReminderRepositoryImpl,
	RoomAddChannelRepositoryImpl,
	RoomCategoryChannelRepositoryImpl,
	RoomChannelRepositoryImpl,
	RoomNotificationChannelRepositoryImpl,
	StickyRepositoryImpl,
	ThreadRepositoryImpl,
	UserCandyItemRepositoryImpl,
	UserRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { CandyNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/CandyNotificationChannelRepositoryImpl";
import { CrownNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/CrownNotificationChannelRepositoryImpl";
import { CustomRoleCommandImpl } from "@/src/repositories/sequelize-mysql/CustomRoleCommandImpl";
import { CustomRoleImpl } from "@/src/repositories/sequelize-mysql/CustomRoleImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { PredefinedRoleCommandImpl } from "@/src/repositories/sequelize-mysql/PredefinedRoleCommandImpl";
import { RoleCustomRoleImpl } from "@/src/repositories/sequelize-mysql/RoleCustomRoleImpl";
import { RolePredefinedRoleImpl } from "@/src/repositories/sequelize-mysql/RolePredefinedRoleImpl";
import { RoleRepositoryImpl } from "@/src/repositories/sequelize-mysql/RoleRepositoryImpl";
import { SequelizeTransaction } from "@/src/repositories/sequelize-mysql/SequelizeTransaction";
import { BotAddRouter } from "@/src/routes/discordjs/events/BotAddRouter";
import { BotRemoveRouter } from "@/src/routes/discordjs/events/BotRemoveRouter";
import { ChannelCreateRouter } from "@/src/routes/discordjs/events/ChannelCreateRouter";
import { ChannelDeleteRouter } from "@/src/routes/discordjs/events/ChannelDeleteRouter";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import { MessageDeleteRouter } from "@/src/routes/discordjs/events/MessageDeleteRouter";
import { MessageReplyRouter } from "@/src/routes/discordjs/events/MessageReplyRouter";
import { ReactionRouter } from "@/src/routes/discordjs/events/ReactionRouter";
import { ReadyStateRouter } from "@/src/routes/discordjs/events/ReadyStateRouter";
import { RoleCreateRouter } from "@/src/routes/discordjs/events/RoleCreateRouter";
import { RoleDeleteRouter } from "@/src/routes/discordjs/events/RoleDeleteRouter";
import { SlashCommandRouter } from "@/src/routes/discordjs/events/SlashCommandRouter";
import { UserAddRouter } from "@/src/routes/discordjs/events/UserAddRouter";
import { UserRemoveRouter } from "@/src/routes/discordjs/events/UserRemoveRouter";
import { VoiceChannelEventRouter } from "@/src/routes/discordjs/events/VoiceChannelEventRouter";
import type { DMChannel, Guild, GuildChannel, GuildMember, Message, PartialMessage } from "discord.js";
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
appContainer.bind<ICandyNotificationChannelRepository>(RepoTypes.CandyNotificationChannelRepository).to(CandyNotificationChannelRepositoryImpl);
appContainer.bind<ICrownNotificationChannelRepository>(RepoTypes.CrownNotificationChannelRepository).to(CrownNotificationChannelRepositoryImpl);
appContainer.bind<IRoomCategoryChannelRepository>(RepoTypes.RoomCategoryChannelRepository).to(RoomCategoryChannelRepositoryImpl);
appContainer.bind<IStickyRepository>(RepoTypes.StickyRepository).to(StickyRepositoryImpl);
appContainer.bind<ICommunityRepository>(RepoTypes.CommunityRepository).to(CommunityRepositoryImpl);
appContainer.bind<IUserRepository>(RepoTypes.UserRepository).to(UserRepositoryImpl);
appContainer.bind<IChannelRepository>(RepoTypes.ChannelRepository).to(ChannelRepositoryImpl);
appContainer.bind<IRoleRepository>(RepoTypes.RoleRepository).to(RoleRepositoryImpl);
appContainer.bind<IRolePredefinedRoleRepository>(RepoTypes.RolePredefinedRoleRepository).to(RolePredefinedRoleImpl);
appContainer.bind<IPredefinedRoleCommandRepository>(RepoTypes.PredefinedRoleCommandRepository).to(PredefinedRoleCommandImpl);
appContainer.bind<ICustomRoleRepository>(RepoTypes.CustomRoleRepository).to(CustomRoleImpl);
appContainer.bind<IRoleCustomRoleRepository>(RepoTypes.RoleCustomRoleRepository).to(RoleCustomRoleImpl);
appContainer.bind<ICustomRoleCommandRepository>(RepoTypes.CustomRoleCommandRepository).to(CustomRoleCommandImpl);
appContainer.bind<IMessageRepository>(RepoTypes.MessageRepository).to(MessageRepositoryImpl);
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
appContainer.bind<ICandyNotificationChannelLogic>(LogicTypes.CandyNotificationChannelLogic).to(CandyNotificationChannelLogic);
appContainer.bind<ICrownNotificationChannelLogic>(LogicTypes.CrownNotificationChannelLogic).to(CrownNotificationChannelLogic);
appContainer.bind<IRoomCategoryChannelLogic>(LogicTypes.RoomCategoryChannelLogic).to(RoomCategoryChannelLogic);
appContainer.bind<IUtilityLogic>(LogicTypes.UtilityLogic).to(UtilityLogic);
appContainer.bind<ICommunityLogic>(LogicTypes.CommunityLogic).to(CommunityLogic);
appContainer.bind<IUserLogic>(LogicTypes.UserLogic).to(UserLogic);
appContainer.bind<IChannelLogic>(LogicTypes.ChannelLogic).to(ChannelLogic);
appContainer.bind<IRoleLogic>(LogicTypes.RoleLogic).to(RoleLogic);
appContainer.bind<IPredefinedRoleLogic>(LogicTypes.PredefinedRoleLogic).to(PredefinedRoleLogic);
appContainer.bind<ICustomRoleLogic>(LogicTypes.CustomRoleLogic).to(CustomRoleLogic);
appContainer.bind<IMessageLogic>(LogicTypes.MessageLogic).to(MessageLogic);

// Handlers
appContainer.bind<ICommandPermissionChecker>(HandlerTypes.CommandPermissionChecker).to(CommandPermissionChecker);
appContainer.bind<DiscordEventHandler<Message>>(HandlerTypes.MessageHandler).to(AIReplyHandler);
appContainer.bind<DiscordEventHandler<Message>>(HandlerTypes.MessageHandler).to(StickyEventHandler);
appContainer.bind<DiscordEventHandler<Message>>(HandlerTypes.MessageHandler).to(TranslateReplyHandler);
appContainer.bind<DiscordEventHandler<ReactionInteraction>>(HandlerTypes.ReactionHandler).to(CandyReactionHandler);
appContainer.bind<DiscordEventHandler<Guild>>(HandlerTypes.BotAddHandler).to(BotAddHandler);
appContainer.bind<DiscordEventHandler<Guild>>(HandlerTypes.BotRemoveHandler).to(BotRemoveHandler);
appContainer.bind<DiscordEventHandler<GuildMember>>(HandlerTypes.UserAddHandler).to(UserAddHandler);
appContainer.bind<DiscordEventHandler<GuildMember>>(HandlerTypes.UserRemoveHandler).to(UserRemoveHandler);
appContainer.bind<DiscordEventHandler<Message | PartialMessage>>(HandlerTypes.MessageDeleteHandler).to(MessageDeleteHandler);
appContainer.bind<DiscordEventHandler<GuildChannel>>(HandlerTypes.ChannelCreateHandler).to(ChannelCreateHandler);
appContainer.bind<DiscordEventHandler<GuildChannel | DMChannel>>(HandlerTypes.ChannelDeleteHandler).to(ChannelDeleteHandler);
appContainer.bind<DiscordEventHandler<any>>(HandlerTypes.RoleCreateHandler).to(RoleCreateHandler);
appContainer.bind<DiscordEventHandler<any>>(HandlerTypes.RoleDeleteHandler).to(RoleDeleteHandler);
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
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(RoomCategoryChannelCreateCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(RoomCategoryChannelDeleteCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CandyNotificationChannelCreateCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CandyNotificationChannelDeleteCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CrownNotificationChannelCreateCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CrownNotificationChannelDeleteCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(RoleBindedByPredefinedRoleCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(RoleReleasedByPredefinedRoleCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CustomRoleBindToggleByCommandHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CustomRoleCreateHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(CustomRoleDeleteHandler);
appContainer.bind<SlashCommandHandler>(HandlerTypes.SlashCommandHandler).to(RoleBindToggleByCustomRoleHandler);

// Routes
appContainer.bind<DiscordEventRouter>(RouteTypes.SlashCommandRoute).to(SlashCommandRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.MessageReplyRoute).to(MessageReplyRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ReadyStateRoute).to(ReadyStateRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ReactionRoute).to(ReactionRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.BotAddRoute).to(BotAddRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.BotRemoveRoute).to(BotRemoveRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.UserAddRoute).to(UserAddRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.UserRemoveRoute).to(UserRemoveRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.MessageDeleteRoute).to(MessageDeleteRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ChannelCreateRoute).to(ChannelCreateRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ChannelDeleteRoute).to(ChannelDeleteRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.RoleCreateRoute).to(RoleCreateRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.RoleDeleteRoute).to(RoleDeleteRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.VoiceChannelEventRoute).to(VoiceChannelEventRouter);
export { appContainer };
