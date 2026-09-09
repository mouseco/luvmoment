/**
 * LuvMoment Video Generator Types
 * 
 * 모든 비디오 생성 관련 타입 정의
 */

import { ThemeType, IntroType } from "@/store/useAppStore";

// ============================================
// Canvas 확장 타입 (letterSpacing 지원)
// ============================================

/**
 * CanvasRenderingContext2D 확장 - letterSpacing 속성 추가
 * 최신 브라우저에서 지원되는 비표준 속성
 */
declare global {
    interface CanvasRenderingContext2D {
        letterSpacing?: string;
    }
}

// ============================================
// 비디오 생성 옵션
// ============================================

export interface AssetInput {
    id: string;
    type: 'image' | 'video';
    url: string; // 이미지 preview URL 또는 영상 videoUrl
    startTime?: number; // 영상인 경우 AI 분석 시작점 (초)
}

export interface VideoGeneratorOptions {
    assets: AssetInput[];
    audioUrl?: string;
    width: number;
    height: number;
    fps: number;
    theme: ThemeType;
    introType?: IntroType;
    onProgress?: (progress: number) => void;
    enableIntro?: boolean;
    enableOutro?: boolean;
    introTitle?: string;
    introSubtitle?: string;
    signal?: AbortSignal;
}

export interface GeneratedVideo {
    blob: Blob;
    url: string;
    duration: number;
}

// ============================================
// 레이아웃 타입
// ============================================

export type LayoutType = "full" | "blurred" | "split";
export type LayoutVariant = 'normal' | 'crop';

// ============================================
// 전환 효과 타입
// ============================================

export type TransitionType = 
    | "cut" 
    | "fade" 
    | "slideLeft" 
    | "slideRight" 
    | "slideUp" 
    | "slideDown" 
    | "zoom" 
    | "wipe" 
    | "flash";

export type SlideDirection = "left" | "right" | "up" | "down";

export interface TransitionOffset {
    offsetX: number;
    offsetY: number;
}

export interface ZoomTransitionResult {
    scale: number;
    alpha: number;
}

// ============================================
// 에셋 메타데이터
// ============================================

export interface AssetMeta {
    id: string;
    type: 'image' | 'video';
    img?: HTMLImageElement;
    video?: HTMLVideoElement;
    aspectRatio: number;
    isPortrait: boolean;
    layout: LayoutType;
    layoutVariant?: LayoutVariant;
    blurredBg?: HTMLCanvasElement;
    duration: number; // ms
    startTimeInVideo?: number; // 영상 소스 내의 시작 지점 (초)
    startTimeInTimeline: number; // 전체 타임라인에서의 시작 지점 (ms)
    pairAsset?: AssetMeta;
    transition: TransitionType;
}

// ============================================
// BPM 분석 관련
// ============================================

export interface BeatInfo {
    bpm: number;
    beatIntervalMs: number;
    beatTimestamps: number[]; // 각 비트의 ms 타임스탬프
}

// ============================================
// 테마 오버레이 캐시
// ============================================

export interface ThemeOverlayCache {
    vignetteCanvas?: HTMLCanvasElement;
    sepiaCanvas?: HTMLCanvasElement;
}

// ============================================
// 이미지 리사이즈 결과
// ============================================

export interface ResizeResult {
    img: HTMLImageElement;
    isResized: boolean;
    tempUrl?: string;
}

// ============================================
// 인트로 기본 텍스트
// ============================================

export interface IntroDefaultTexts {
    title: string;
    subtitle: string;
}

export const INTRO_DEFAULT_TEXTS: Record<IntroType, IntroDefaultTexts> = {
    cinematic: { title: 'Our Story', subtitle: 'Special Moments' },
    romantic: { title: 'Romantic Moment', subtitle: 'With You' },
    travel: { title: 'Adventure', subtitle: 'Our Journey' },
};

// ============================================
// 비디오 설정 상수
// ============================================

export const VIDEO_CONFIG = {
    INTRO_DURATION_MS: 3000,
    OUTRO_DURATION_MS: 3000,
    DEFAULT_FPS: 30,
    MAX_ASSETS: 30,
    DEFAULT_BPM: 120,
    MIN_BPM: 60,
    MAX_BPM: 180,
} as const;

// ============================================
// Re-export store types for convenience
// ============================================

export type { ThemeType, IntroType };
