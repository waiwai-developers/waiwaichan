import { TranslateConst } from "@/entities/constants/translate";
import { ValueObject } from "./ValueObject";
export class TranslateSourceLanguage extends ValueObject<string> {
	validator = (value: string) => {
		return TranslateConst.source.map((r) => r.value).includes(value);
	};
}
