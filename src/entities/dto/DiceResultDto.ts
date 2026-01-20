import type { DiceResultDescription } from "../vo/DiceResultDescription";
import type { DiceResultOk } from "../vo/DiceResultOk";
import type { DiceResultTitle } from "../vo/DiceResultTitle";

export class DiceResultDto {
	constructor(
		public ok: DiceResultOk,
		public title: DiceResultTitle,
		public description: DiceResultDescription,
	) {}
}
