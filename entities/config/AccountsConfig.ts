import json from "@/config/accounts.json";
interface UserAssociation {
	user: {
		githubId: string;
		discordId: string;
	};
}
// TODO JSONの構造を修正する
export const AccountsConfig: Array<UserAssociation> = json;
