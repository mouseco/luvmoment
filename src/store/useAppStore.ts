import { create } from 'zustand';

// 에셋 타입 (이미지 또는 영상)
export interface SelectedAsset {
    id: string;
    file: File;
    preview: string; // 이미지인 경우 원본/리사이징 미리보기, 영상인 경우 썸네일
    type: 'image' | 'video';
    videoUrl?: string; // 영상인 경우 실제 영상 URL
    startTime?: number; // 영상인 경우 AI가 분석한 하이라이트 시작 시간 (초)
}

// 테마 타입
export type ThemeType = 'love' | 'anniversary' | 'travel';

// 인트로 타입
export type IntroType = 'cinematic' | 'romantic' | 'travel';

// BGM 타입
export interface BGMTrack {
    id: string;
    name: string;
    artist: string;
    duration?: number; // optional - 런타임에 자동 추출됨
    src: string;
}

// 전체 앱 상태
interface AppState {
    // 에셋 (이미지/영상)
    images: SelectedAsset[];
    addImages: (newImages: SelectedAsset[]) => void;
    removeImage: (id: string) => void;
    reorderImages: (fromIndex: number, toIndex: number) => void;
    clearImages: () => void;

    // 테마
    selectedTheme: ThemeType;
    setTheme: (theme: ThemeType) => void;

    // 인트로
    selectedIntro: IntroType;
    setIntro: (intro: IntroType) => void;

    // 🆕 인트로 커스텀 텍스트
    introTitle: string;
    introSubtitle: string;
    setIntroTitle: (title: string) => void;
    setIntroSubtitle: (subtitle: string) => void;

    // BGM
    selectedBGM: string | null;
    setBGM: (bgmId: string | null) => void;

    // 전체 초기화
    reset: () => void;
}

function releaseAsset(asset: SelectedAsset): void {
    for (const url of new Set([asset.preview, asset.videoUrl])) {
        if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    }
}

export const useAppStore = create<AppState>((set) => ({
    // 이미지 상태
    images: [],
    addImages: (newImages) =>
        set((state) => {
            const available = Math.max(0, 30 - state.images.length);
            newImages.slice(available).forEach(releaseAsset);
            return { images: [...state.images, ...newImages.slice(0, available)] };
        }),
    removeImage: (id) =>
        set((state) => {
            const removed = state.images.find((img) => img.id === id);
            if (removed) {
                releaseAsset(removed);
            }
            return { images: state.images.filter((img) => img.id !== id) };
        }),
    reorderImages: (fromIndex, toIndex) =>
        set((state) => {
            if (fromIndex < 0 || toIndex < 0 || fromIndex >= state.images.length || toIndex >= state.images.length) return state;
            const updated = [...state.images];
            const [moved] = updated.splice(fromIndex, 1);
            updated.splice(toIndex, 0, moved);
            return { images: updated };
        }),
    clearImages: () =>
        set((state) => {
            state.images.forEach(releaseAsset);
            return { images: [] };
        }),

    // 테마 상태
    selectedTheme: 'love',
    setTheme: (theme) => set({ selectedTheme: theme }),

    // 인트로 상태
    selectedIntro: 'cinematic',
    setIntro: (intro) => set({ selectedIntro: intro }),

    // 🆕 인트로 커스텀 텍스트 상태
    introTitle: '',
    introSubtitle: '',
    setIntroTitle: (title) => set({ introTitle: title }),
    setIntroSubtitle: (subtitle) => set({ introSubtitle: subtitle }),

    // BGM 상태
    selectedBGM: null,
    setBGM: (bgmId) => set({ selectedBGM: bgmId }),

    // 전체 초기화
    reset: () =>
        set((state) => {
            state.images.forEach(releaseAsset);
            return {
                images: [],
                selectedTheme: 'love',
                selectedIntro: 'cinematic',
                introTitle: '',
                introSubtitle: '',
                selectedBGM: null,
            };
        }),
}));

// 테마 정보
export const THEMES = {
    love: {
        id: 'love',
        name: 'Love',
        emoji: '💕',
        description: '로맨틱하고 따뜻한 분위기',
        colors: ['#FF6B6B', '#FF8E8E', '#FFD4D4'],
    },
    anniversary: {
        id: 'anniversary',
        name: 'Anniversary',
        emoji: '🎂',
        description: '특별한 날을 축하하는 느낌',
        colors: ['#FFD93D', '#FFE566', '#FFF4CC'],
    },
    travel: {
        id: 'travel',
        name: 'Travel',
        emoji: '✈️',
        description: '활기차고 모험적인 분위기',
        colors: ['#4ECDC4', '#7FDBDB', '#C4F5F5'],
    },
} as const;

// BGM 목록
export const BGM_TRACKS: BGMTrack[] = [
    {
        id: 'bgm-love',
        name: 'Love',
        artist: 'Romantic Piano',
        duration: 131, // 약 3.9MB = ~131초 (256kbps 기준)
        src: '/bgm/love.mp3',
    },
    {
        id: 'bgm-sunrise',
        name: 'Sunrise',
        artist: 'Chill Acoustic',
        duration: 160, // 약 4.8MB = ~160초
        src: '/bgm/sunrise.mp3',
    },
];
