import { ValueObject } from "./ValueObject";

export class ChannelType extends ValueObject<number> {
	static DiscordOther = new ChannelType(0);
	static DiscordDM = new ChannelType(1);
	static DiscordText = new ChannelType(2);
	static DiscordVoice = new ChannelType(3);
	static DiscordGroupDM = new ChannelType(4);
	static DiscordCategory = new ChannelType(5);
	static DiscordAnnouncement = new ChannelType(6);
	static DiscordAnnouncementThread = new ChannelType(7);
	static DiscordPublicThread = new ChannelType(8);
	static DiscordPrivateThread = new ChannelType(9);
	static DiscordStageVoice = new ChannelType(10);
	static DiscordForum = new ChannelType(11);
	static DiscordMedia = new ChannelType(12);
}
