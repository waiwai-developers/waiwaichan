import type { DiceSource } from "../vo/DiceSource";
import type { DiceIsSecret } from "../vo/DiceIsSecret";
import type { DiceShowDetails } from "../vo/DiceShowDetails";
import type { DiscordUserDisplayName } from "../vo/DiscordUserDisplayName";
import type { DiscordUserDefaultAvatarURL } from "../vo/DiscordUserDefaultAvatarURL";

export class DiceContextDto {
	constructor(
		public source: DiceSource,
		public isSecret: DiceIsSecret,
		public showDetails: DiceShowDetails,
		public userDisplayName: DiscordUserDisplayName,
		public userDefaultAvatarURL: DiscordUserDefaultAvatarURL,
	) { }
}
