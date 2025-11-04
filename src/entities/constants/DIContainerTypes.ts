export const RepoTypes = {
	Mutex: Symbol.for("Mutex"),
	DatabaseConnector: Symbol.for("DatabaseConnector"),
	Transaction: Symbol.for("Transaction"),
	CandyRepository: Symbol.for("CandyRepository"),
	CrownRepository: Symbol.for("CrownRepository"),
	CandyItemRepository: Symbol.for("CandyItemRepository"),
	UserCandyItemRepository: Symbol.for("UserCandyItemRepository"),
	ReminderRepository: Symbol.for("ReminderRepository"),
	ThreadRepository: Symbol.for("ThreadRepository"),
	PersonalityRepository: Symbol.for("PersonalityRepository"),
	ContextRepository: Symbol.for("ContextRepository"),
	PersonalityContextRepository: Symbol.for("PersonalityContextRepository"),
	ChatAIRepository: Symbol.for("ChatAIRepository"),
	TranslateRepository: Symbol.for("TranslateRepository"),
	VMInstanceRepository: Symbol.for("VMInstanceRepository"),
	PullRequestRepository: Symbol.for("PullRequestRepository"),
	StickyRepository: Symbol.for("StickyRepository"),
	RoomAddChannelRepository: Symbol.for("RoomAddChannelRepository"),
	RoomNotificationChannelRepository: Symbol.for(
		"RoomNotificationChannelRepository",
	),
	RoomChannelRepository: Symbol.for("RoomChannelRepository"),
	SequelizeModels: Symbol.for("SequelizeModels"),
	Logger: Symbol.for("Logger"),
};
export const LogicTypes = {
	ThreadLogic: Symbol.for("ThreadLogic"),
	PersonalityLogic: Symbol.for("PersonalityLogic"),
	ContextLogic: Symbol.for("ContextLogic"),
	PersonalityContextLogic: Symbol.for("PersonalityContextLogic"),
	ChatAILogic: Symbol.for("ChatAILogic"),
	MinecraftServerLogic: Symbol.for("MinecraftServerLogic"),
	CandyLogic: Symbol.for("CandyLogic"),
	ReminderLogic: Symbol.for("ReminderLogic"),
	PullRequestLogic: Symbol.for("PullRequestLogic"),
	TranslatorLogic: Symbol.for("TranslateLogic"),
	StickyLogic: Symbol.for("StickyLogic"),
	UtilityLogic: Symbol.for("UtilityLogic"),
	CrownLogic: Symbol.for("CrownLogic"),
	RoomAddChannelLogic: Symbol.for("RoomAddChannelLogic"),
	RoomNotificationChannelLogic: Symbol.for("RoomNotificationChannelLogic"),
	RoomChannelLogic: Symbol.for("RoomChannelLogic"),
};

export const RouteTypes = {
	SlashCommandRoute: Symbol.for("SlashCommandRoute"),
	MessageReplyRoute: Symbol.for("MessageReplyRoute"),
	ReadyStateRoute: Symbol.for("ReadyStateRoute"),
	ReactionRoute: Symbol.for("ReactionRoute"),
	VoiceChannelEventRoute: Symbol.for("VoiceChannelEventRoute"),
};

export const SchedulerRepoTypes = {
	ReminderSchedulerRepository: Symbol.for("ReminderSchedulerRepository"),
};

export const HandlerTypes = {
	SlashCommandHandler: Symbol.for("SlashCommandHandler"),
	ReactionHandler: Symbol.for("ReactionHandler"),
	MessageHandler: Symbol.for("MessageHandler"),
	VoiceChannelEventHandler: Symbol.for("VoiceChannelEventHandler"),
};
