import { ValueObject } from "./ValueObject";

export class PersonalityId extends ValueObject<number> {
	static PERSONALITY_ID_WAIWAICHAN = new PersonalityId(1);
}
