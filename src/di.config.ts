import "@abraham/reflection";
import { LogicTypes, RepoTypes, RouteTypes, SchedulerRepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChatAILogic } from "@/src/logics/ChatAILogic";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { IMinecraftServerLogic } from "@/src/logics/Interfaces/logics/IMinecraftServerLogic";
import type { IPointLogic } from "@/src/logics/Interfaces/logics/IPointLogic";
import type { IPullRequestLogic } from "@/src/logics/Interfaces/logics/IPullRequestLogic";
import type { IReminderLogic } from "@/src/logics/Interfaces/logics/IReminderLogic";
import type { ITranslatorLogic } from "@/src/logics/Interfaces/logics/ITranslatorLogic";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import type { IChatAIRepository } from "@/src/logics/Interfaces/repositories/chataiapi/IChatAIRepository";
import type { IVirtualMachineAPI } from "@/src/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";
import type { IPointItemRepository } from "@/src/logics/Interfaces/repositories/database/IPointItemRepository";
import type { IPointRepository } from "@/src/logics/Interfaces/repositories/database/IPointRepository";
import type { IReminderRepository } from "@/src/logics/Interfaces/repositories/database/IReminderRepository";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import type { IUserPointItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserPointItemRepository";
import type { IPullRequestRepository } from "@/src/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import type { ITranslatorRepository } from "@/src/logics/Interfaces/repositories/translator/ITranslatorRepository";
import { MinecraftServerLogic } from "@/src/logics/MinecraftServerLogic";
import { PointLogic } from "@/src/logics/PointLogic";
import { PullRequestLogic } from "@/src/logics/PullRequestLogic";
import { ReminderLogic } from "@/src/logics/ReminderLogic";
import { TranslatorLogic } from "@/src/logics/TranslatorLogic";
import { UtilityLogic } from "@/src/logics/UtilityLogic";
import { ChatGPTRepositoryImpl } from "@/src/repositories/chatgptapi/ChatGPTRepositoryImpl";
import { DeepLTranslateRepositoryImpl } from "@/src/repositories/deeplapi/DeepLTranslateRepositoryImpl";
import { GCPComputeEngineInstanceRepositoryImpl } from "@/src/repositories/gcpapi/GCPComputeEngineInstanceRepositoryImpl";
import { GithubPullRequestRepositoryImpl } from "@/src/repositories/githubapi/GithubPullRequestRepositoryImpl";
import { PointItemRepositoryImpl, PointRepositoryImpl, ReminderRepositoryImpl, ReminderSchedulerRepositoryImpl, UserPointItemRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { SequelizeTransaction } from "@/src/repositories/sequelize-mysql/SequelizeTransaction";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import { MessageReplyRouter } from "@/src/routes/discordjs/events/MessageReplyRouter";
import { ReactionRouter } from "@/src/routes/discordjs/events/ReactionRouter";
import { ReadyStateRouter } from "@/src/routes/discordjs/events/ReadyStateRouter";
import { SlashCommandRouter } from "@/src/routes/discordjs/events/SlashCommandRouter";
import { Container } from "inversify";

// for app
const appContainer = new Container();

// Repositories
// Database
appContainer.bind<ITransaction<TransactionLike>>(RepoTypes.Transaction).to(SequelizeTransaction);
appContainer.bind<IPointRepository>(RepoTypes.PointRepository).to(PointRepositoryImpl);
appContainer.bind<IPointItemRepository>(RepoTypes.PointItemRepository).to(PointItemRepositoryImpl);
appContainer.bind<IUserPointItemRepository>(RepoTypes.UserPointItemRepository).to(UserPointItemRepositoryImpl);
appContainer.bind<IReminderRepository>(RepoTypes.ReminderRepository).to(ReminderRepositoryImpl);
// ChatGPT
appContainer.bind<IChatAIRepository>(RepoTypes.ChatAIRepository).to(ChatGPTRepositoryImpl);
// DeepL
appContainer.bind<ITranslatorRepository>(RepoTypes.TranslateRepository).to(DeepLTranslateRepositoryImpl);
// GCP
appContainer.bind<IVirtualMachineAPI>(RepoTypes.VMInstanceRepository).to(GCPComputeEngineInstanceRepositoryImpl);
// Github
appContainer.bind<IPullRequestRepository>(RepoTypes.PullRequestRepository).to(GithubPullRequestRepositoryImpl);

// Logics
appContainer.bind<IChatAILogic>(LogicTypes.ChatAILogic).to(ChatAILogic);
appContainer.bind<IMinecraftServerLogic>(LogicTypes.MinecraftServerLogic).to(MinecraftServerLogic);
appContainer.bind<IPointLogic>(LogicTypes.PointLogic).to(PointLogic);
appContainer.bind<IReminderLogic>(LogicTypes.ReminderLogic).to(ReminderLogic);
appContainer.bind<IPullRequestLogic>(LogicTypes.PullRequestLogic).to(PullRequestLogic);
appContainer.bind<ITranslatorLogic>(LogicTypes.TranslateLogic).to(TranslatorLogic);
appContainer.bind<IUtilityLogic>(LogicTypes.UtilityLogic).to(UtilityLogic);

// Routes
appContainer.bind<DiscordEventRouter>(RouteTypes.SlashCommandRoute).to(SlashCommandRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.MessageReplyRoute).to(MessageReplyRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ReadyStateRoute).to(ReadyStateRouter);
appContainer.bind<DiscordEventRouter>(RouteTypes.ReactionRoute).to(ReactionRouter);

// for scheduler
const schedulerContainer = new Container();
schedulerContainer.bind<IReminderSchedulerRepository>(SchedulerRepoTypes.ReminderSchedulerRepository).to(ReminderSchedulerRepositoryImpl);

export { appContainer, schedulerContainer };