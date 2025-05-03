import type { User } from "discord.js";
import type { DiceSource } from "../vo/DiceSource";
import type { DiceIsSecret } from "../vo/DiceIsSecret";
import type { DiceShowDetails } from "../vo/DiceShowDetails";

export class DiceContextDto {
	constructor(
		public source: DiceSource,
		public isSecret: DiceIsSecret,
		public showDetails: DiceShowDetails,
		public user: User,
	) {}
}
