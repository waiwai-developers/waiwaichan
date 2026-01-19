import type { DiceIsSecret } from "@/src/entities/vo/DiceIsSecret";
import type { DiceShowDetails } from "@/src/entities/vo/DiceShowDetails";
import type { DiceSource } from "@/src/entities/vo/DiceSource";

export class DiceContextDto {
	constructor(
		public source: DiceSource,
		public isSecret: DiceIsSecret,
		public showDetails: DiceShowDetails,
	) {}
}
