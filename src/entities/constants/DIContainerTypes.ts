export const RepoTypes = {
	Mutex: Symbol.for("Mutex"),
	DatabaseConnector: Symbol.for("DatabaseConnector"),
	Transaction: Symbol.for("Transaction"),
	CandyRepository: Symbol.for("CandyRepository"),
	CandyItemRepository: Symbol.for("CandyItemRepository"),
	UserCandyItemRepository: Symbol.for("UserCandyItemRepository"),
	ReminderRepository: Symbol.for("ReminderRepository"),
	ThreadRepository: Symbol.for("ThreadRepository"),
	ChatAIRepository: Symbol.for("ChatAIRepository"),
	TranslateRepository: Symbol.for("TranslateRepository"),
	VMInstanceRepository: Symbol.for("VMInstanceRepository"),
	PullRequestRepository: Symbol.for("PullRequestRepository"),
	StickyRepository: Symbol.for("StickyRepository"),
	CommunityRepository: Symbol.for("CommunityRepository"),
	UserRepository: Symbol.for("UserRepository"),
	SequelizeModels: Symbol.for("SequelizeModels"),
	Logger: Symbol.for("Logger"),
};
export const LogicTypes = {
	ThreadLogic: Symbol.for("ThreadLogic"),
	ChatAILogic: Symbol.for("ChatAILogic"),
	MinecraftServerLogic: Symbol.for("MinecraftServerLogic"),
	CandyLogic: Symbol.for("CandyLogic"),
	ReminderLogic: Symbol.for("ReminderLogic"),
	PullRequestLogic: Symbol.for("PullRequestLogic"),
	TranslatorLogic: Symbol.for("TranslateLogic"),
	StickyLogic: Symbol.for("StickyLogic"),
	UtilityLogic: Symbol.for("UtilityLogic"),
	CommunityLogic: Symbol.for("UserLogic"),
	UserLogic: Symbol.for("UserLogic"),
};

export const RouteTypes = {
	SlashCommandRoute: Symbol.for("SlashCommandRoute"),
	MessageReplyRoute: Symbol.for("MessageReplyRoute"),
	ReadyStateRoute: Symbol.for("ReadyStateRoute"),
	ReactionRoute: Symbol.for("ReactionRoute"),
	ActionAddBotRoute: Symbol.for("ActionAddBotRoute"),
	ActionRemoveBotRoute: Symbol.for("ActionRemoveBotRoute"),
	ActionAddUserRoute: Symbol.for("ActionAddUserRoute"),
	ActionRemoveUserRoute: Symbol.for("ActionRemoveUserRoute"),
};

export const SchedulerRepoTypes = {
	ReminderSchedulerRepository: Symbol.for("ReminderSchedulerRepository"),
};

export const HandlerTypes = {
	SlashCommandHandler: Symbol.for("SlashCommandHandler"),
	ReactionHandler: Symbol.for("ReactionHandler"),
	MessageHandler: Symbol.for("MessageHandler"),
	ActionAddBotHandler: Symbol.for("ActionAddBotHandler"),
	ActionRemoveBotHandler: Symbol.for("ActionRemoveBotHandler"),
	ActionAddUserHandler: Symbol.for("ActionAddUserHandler"),
	ActionRemoveUserHandler: Symbol.for("ActionRemoveUserHandler"),
};
