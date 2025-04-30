import { ValueObject } from "./ValueObject";

export class PersonalityId extends ValueObject<number> {
    static CATEGORY_TYPE_CHATGPT = new PersonalityId(1);
}
