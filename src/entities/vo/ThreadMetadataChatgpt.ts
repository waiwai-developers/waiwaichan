import { ValueObject } from "./ValueObject";

export class ThreadMetadataChatgpt extends ValueObject<JSON> {
	validator = (value: JSON) => {
		const metadata = JSON.parse(JSON.stringify(value));
		return (
			metadata?.persona_role &&
			metadata?.speaking_style_rules &&
			metadata?.response_directives &&
			metadata?.emotion_model &&
			metadata?.notes &&
			metadata?.input_scope
		);
	};
}
