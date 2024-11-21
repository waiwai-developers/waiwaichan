import { TranslateConst } from "@/src/entities/constants/translate";
import { ValueObject } from "./ValueObject";
export class TranslateTargetLanguage extends ValueObject<string> {
	validator = (value: string) => {
		return TranslateConst.target.map((r) => r.value).includes(value);
	};
}
