import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import type { StickyDto } from "@/src/entities/dto/StickyDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class StickyListCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.StickyLogic)
	private stickyLogic!: IStickyLogic;

	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.ChannelLogic)
	private channelLogic!: IChannelLogic;
	isHandle(commandName: string): boolean {
		return commandName === "stickylist";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (!interaction.guildId) {
			return;
		}
		if (interaction.channel == null) {
			return;
		}

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (communityId == null) {
			await interaction.reply("コミュニティが登録されていなかったよ！っ");
			return;
		}

		const stickys = await this.stickyLogic.findByCommunityId(communityId);
		if (stickys.length === 0) {
			await interaction.reply("スティッキーが登録されていなかったよ！っ");
			return;
		}

		const channelListPromises = stickys.map(async (s: StickyDto) => {
			const clientId = await this.channelLogic.getClientIdById(s.channelId);
			if (clientId == null) {
				return null;
			}
			return `- <#${clientId.getValue()}>`;
		});
		const channelList = (await Promise.all(channelListPromises)).filter(
			(c): c is string => c !== null,
		);

		if (channelList.length === 0) {
			await interaction.reply("スティッキーが登録されていなかったよ！っ");
			return;
		}

		await interaction.reply(
			[
				"以下のチャンネルにスティッキーが登録されているよ！",
				...channelList,
			].join("\n"),
		);
	}
}
