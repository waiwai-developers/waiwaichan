import { ValueObject } from "./ValueObject";

export class ChatAIRole extends ValueObject<"system" | "user" | "assistant"> {
	static SYSTEM = new ChatAIRole("system");
	static USER = new ChatAIRole("user");
	static ASSISTANT = new ChatAIRole("assistant");
}
