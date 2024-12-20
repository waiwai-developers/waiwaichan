import json from "../../../config/accounts.json" with { type: "json" };
interface UserAssociation {
	githubId: string;
	discordId: string;
}

interface AccountsConfigType {
	users: Array<UserAssociation>;
}

export const AccountsConfig: AccountsConfigType = json;
