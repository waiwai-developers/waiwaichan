export interface MockVoiceStateResult {
	oldState: any;
	newState: any;
	oldChannelMock?: any;
	newChannelMock?: any;
}

/**
 * VoiceStateのモックを作成する（プロパティを上書き可能な形式）
 */
export function mockVoiceState(
	oldChannelId: string | null,
	newChannelId: string | null,
	guildId: string,
	userId: string,
	displayName = "TestUser",
): MockVoiceStateResult {
	let createdChannelId: string | null = null;
	const channelCache = new Map<string, any>();

	// oldChannelのモック
	const oldChannelMock = oldChannelId
		? {
				id: oldChannelId,
				name: "Test Old Voice Channel",
				members: {
					size: 0,
					filter: () => ({ size: 0 }),
				},
				createdTimestamp: Date.now() - 3600000,
			}
		: null;

	// newChannelのモック
	const newChannelMock = newChannelId
		? {
				id: newChannelId,
				name: "Test New Voice Channel",
				isTextBased: () => false,
			}
		: null;

	// 共通のguild.channels構造（両方のstateで共有）
	const guildChannels = {
		cache: {
			get: (id: string) => {
				const idStr = id;
				return channelCache.get(idStr) || null;
			},
		},
		create: async (options: any) => {
			const newChannel = {
				id: createdChannelId,
				guildId: guildId,
				name: options.name,
				createdTimestamp: Date.now(),
			};
			return newChannel;
		},
		delete: async (id: string) => {
			channelCache.delete(id);
			return true;
		},
	};

	// 共通のguild構造
	const guild = {
		id: guildId,
		channels: guildChannels,
	};

	// oldState
	const oldState = {
		channelId: oldChannelId ? oldChannelId : null,
		member: {
			user: {
				id: userId,
				displayName: displayName,
				bot: false,
			},
			voice: {
				setChannel: async (channel: any) => {
					return {};
				},
			},
		},
		channel: oldChannelMock,
		guild: guild,
	};

	// newState
	const newState = {
		channelId: newChannelId ? newChannelId : null,
		member: {
			user: {
				id: userId,
				displayName: displayName,
				bot: false,
			},
			voice: {
				setChannel: async (channel: any) => {
					return {};
				},
			},
		},
		channel: newChannelMock,
		guild: guild,
		getCreatedChannelId: () => createdChannelId,
	};

	return {
		oldState,
		newState,
		oldChannelMock,
		newChannelMock,
	};
}

/**
 * テキストチャンネルのモックを追加する
 */
export function addMockTextChannel(state: any, channelId: string, send: (options: any) => Promise<any>) {
	const textChannelMock = {
		id: channelId,
		isTextBased: () => true,
		send: send,
	};

	// Update guild.channels.cache.get
	const originalGet = state.guild.channels.cache.get;
	state.guild.channels.cache.get = (id: string) => {
		if (id === channelId) {
			return textChannelMock;
		}
		return originalGet(id);
	};
}
