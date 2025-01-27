import { ValueObject } from "./ValueObject";

export class ThreadMetadata extends ValueObject<
	{} | { githubId: string; discordId: string }
> {}
