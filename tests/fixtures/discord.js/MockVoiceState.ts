export interface MockVoiceStateResult {
	oldState: any;
	newState: any;
	oldChannelMock?: any;
	newChannelMock?: any;
}

/**
 * VoiceStateのモックを作成する（プロパティを上書き可能な形式）
 * @param predictableCreatedChannelId オプション: 作成されるチャンネルに使用する予測可能なID（テストでChannel事前作成用）
 */
export function mockVoiceState(
	oldChannelId: string | null,
	newChannelId: string | null,
	guildId: string,
	userId: string,
	displayName = "TestUser",
	predictableCreatedChannelId: string | null = null,
): MockVoiceStateResult {
	let createdChannelId: string | null = null;
	const channelCache = new Map<string, any>();

	// oldChannelのモック
	const oldChannelMock = oldChannelId
		? {
				id: String(oldChannelId),
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

	// 初期チャンネルをキャッシュに追加
	if (oldChannelMock) {
		channelCache.set(String(oldChannelId), oldChannelMock);
	}
	if (newChannelMock && String(newChannelId) !== String(oldChannelId)) {
		channelCache.set(String(newChannelId), newChannelMock);
	}

	// 共通のguild.channels構造（両方のstateで共有）
	const guildChannels = {
		cache: {
			get: (id: number | string) => {
				const idStr = String(id);
				return channelCache.get(idStr) || null;
			},
		},
		create: async (options: any) => {
			// 予測可能なIDが指定されていればそれを使用、なければランダムID
			createdChannelId = predictableCreatedChannelId || String(Math.floor(Math.random() * 1000000) + 1000);
			const newChannel = {
				id: createdChannelId,
				guildId: guildId,
				name: options.name,
				createdTimestamp: Date.now(),
			};
			channelCache.set(createdChannelId, newChannel);
			return newChannel;
		},
		delete: async (id: string) => {
			channelCache.delete(String(id));
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
		channelId: oldChannelId ? String(oldChannelId) : null,
		member: {
			user: {
				id: userId,
				displayName: displayName,
				bot: false,
				displayAvatarURL: (options?: any) => "https://example.com/avatar.png",
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
		channelId: newChannelId ? String(newChannelId) : null,
		member: {
			user: {
				id: userId,
				displayName: displayName,
				bot: false,
				displayAvatarURL: (options?: any) => "https://example.com/avatar.png",
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
		if (String(id) === channelId) {
			return textChannelMock;
		}
		return originalGet(id);
	};
}
