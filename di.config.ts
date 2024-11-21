import "@abraham/reflection";
import { LogicTypes, RepoTypes, RouteTypes, SchedulerRepoTypes } from "@/entities/constants/DIContainerTypes";
import { ChatAILogic } from "@/logics/ChatAILogic";
import type { IChatAILogic } from "@/logics/Interfaces/logics/IChatAILogic";
import type { IMinecraftServerLogic } from "@/logics/Interfaces/logics/IMinecraftServerLogic";
import type { IPointLogic } from "@/logics/Interfaces/logics/IPointLogic";
import type { IPullRequestLogic } from "@/logics/Interfaces/logics/IPullRequestLogic";
import type { IReminderLogic } from "@/logics/Interfaces/logics/IReminderLogic";
import type { ITranslatorLogic } from "@/logics/Interfaces/logics/ITranslatorLogic";
import type { IUtilityLogic } from "@/logics/Interfaces/logics/IUtilityLogic";
import type { IChatAIRepository } from "@/logics/Interfaces/repositories/chataiapi/IChatAIRepository";
import type { IVirtualMachineAPI } from "@/logics/Interfaces/repositories/cloudprovider/IVirtualMachineAPI";
import type { IPointItemRepository } from "@/logics/Interfaces/repositories/database/IPointItemRepository";
import type { IPointRepository } from "@/logics/Interfaces/repositories/database/IPointRepository";
import type { IReminderRepository } from "@/logics/Interfaces/repositories/database/IReminderRepository";
import type { IReminderSchedulerRepository } from "@/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import type { IUserPointItemRepository } from "@/logics/Interfaces/repositories/database/IUserPointItemRepository";
import type { IPullRequestRepository } from "@/logics/Interfaces/repositories/githubapi/IPullRequestRepository";
import type { ITranslatorRepository } from "@/logics/Interfaces/repositories/translator/ITranslatorRepository";
import { MinecraftServerLogic } from "@/logics/MinecraftServerLogic";
import { PointLogic } from "@/logics/PointLogic";
import { PullRequestLogic } from "@/logics/PullRequestLogic";
import { ReminderLogic } from "@/logics/ReminderLogic";
import { TranslatorLogic } from "@/logics/TranslatorLogic";
import { UtilityLogic } from "@/logics/UtilityLogic";
import { ChatGPTRepositoryImpl } from "@/repositories/chatgptapi/ChatGPTRepositoryImpl";
import { DeepLTranslateRepositoryImpl } from "@/repositories/deeplapi/DeepLTranslateRepositoryImpl";
import { GCPComputeEngineInstanceRepositoryImpl } from "@/repositories/gcpapi/GCPComputeEngineInstanceRepositoryImpl";
import { GithubPullRequestRepositoryImpl } from "@/repositories/githubapi/GithubPullRequestRepositoryImpl";
import { PointItemRepositoryImpl, PointRepositoryImpl, ReminderRepositoryImpl, ReminderSchedulerRepositoryImpl, UserPointItemRepositoryImpl } from "@/repositories/sequelize-mysql";
import { SequelizeTransaction } from "@/repositories/sequelize-mysql/SequelizeTransaction";
import type { DiscordEventRouter } from "@/routes/discordjs/events/DiscordEventRouter";
import { MessageReplyRouter } from "@/routes/discordjs/events/MessageReplyRouter";
import { ReactionRouter } from "@/routes/discordjs/events/ReactionRouter";
import { ReadyStateRouter } from "@/routes/discordjs/events/ReadyStateRouter";
import { SlashCommandRouter } from "@/routes/discordjs/events/SlashCommandRouter";
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
