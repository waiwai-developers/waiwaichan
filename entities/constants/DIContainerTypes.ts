export const RepoTypes = {
	Transaction: Symbol.for("Transaction"),
	PointRepository: Symbol.for("PointRepository"),
	PointItemRepository: Symbol.for("PointItemRepository"),
	UserPointItemRepository: Symbol.for("UserPointItemRepository"),
	ReminderRepository: Symbol.for("ReminderRepository"),
	ChatAIRepository: Symbol.for("ChatAIRepository"),
	TranslateRepository: Symbol.for("TranslateRepository"),
	VMInstanceRepository: Symbol.for("VMInstanceRepository"),
	PullRequestRepository: Symbol.for("PullRequestRepository"),
};
export const LogicTypes = {
	ChatAILogic: Symbol.for("ChatAILogic"),
	MinecraftServerLogic: Symbol.for("MinecraftServerLogic"),
	PointLogic: Symbol.for("PointLogic"),
	ReminderLogic: Symbol.for("ReminderLogic"),
	PullRequestLogic: Symbol.for("PullRequestLogic"),
	TranslateLogic: Symbol.for("TranslateLogic"),
	UtilityLogic: Symbol.for("UtilityLogic"),
};

export const RouteTypes = {
	SlashCommandRoute: Symbol.for("SlashCommandRoute"),
	MessageReplyRoute: Symbol.for("MessageReplyRoute"),
	ReadyStateRoute: Symbol.for("ReadyStateRoute"),
	ReactionRoute: Symbol.for("ReactionRoute"),
};

export const SchedulerRepoTypes = {
	ReminderSchedulerRepository: Symbol.for("ReminderSchedulerRepository"),
};
