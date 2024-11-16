import json from "@/config.json" with { type: "json" };
interface DiscordConfig {
	token: string;
	clientId: string;
	guildId: string;
}
interface DeepLConfig {
	deeplApiKey: string;
}
interface OpenAIConfig {
	openaiApiKey: string;
	gptModel: string;
	gptPrompt: string;
}

interface GithubConfig {
	token: string;
}
interface AppConfigJson {
	discord: DiscordConfig;
	deepl: DeepLConfig;
	openai: OpenAIConfig;
	github: GithubConfig;
	backend: {
		reminderSpan: number;
		pointEmoji: string;
	};
}

export const AppConfig: AppConfigJson = json;
