import { ValueObject } from "./ValueObject";

export class ChatAIRole extends ValueObject<"system"|"user"|"assistant"> {}
