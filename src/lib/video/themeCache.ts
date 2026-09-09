/**
 * Theme Overlay Cache
 * 
 * 테마별 정적 오버레이를 미리 생성합니다.
 * 매 프레임마다 재계산하지 않고 캐시된 이미지를 사용하여 끊김 방지
 */

import { ThemeType, ThemeOverlayCache } from './types';

/**
 * 테마별 정적 오버레이를 미리 생성합니다.
 * 
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param theme - 테마 타입
 * @returns 테마 오버레이 캐시 객체
 */
export function createThemeOverlayCache(
    width: number,
    height: number,
    theme: ThemeType
): ThemeOverlayCache {
    const cache: ThemeOverlayCache = {};

    if (theme === "anniversary") {
        // 세피아 오버레이
        cache.sepiaCanvas = document.createElement('canvas');
        cache.sepiaCanvas.width = width;
        cache.sepiaCanvas.height = height;
        const sepiaCtx = cache.sepiaCanvas.getContext('2d');
        if (sepiaCtx) {
            sepiaCtx.fillStyle = "#704214";
            sepiaCtx.globalAlpha = 0.15;
            sepiaCtx.fillRect(0, 0, width, height);
            sepiaCtx.globalAlpha = 1;
        }

        // 비네팅 오버레이
        cache.vignetteCanvas = document.createElement('canvas');
        cache.vignetteCanvas.width = width;
        cache.vignetteCanvas.height = height;
        const vignetteCtx = cache.vignetteCanvas.getContext('2d');
        if (vignetteCtx) {
            const v = vignetteCtx.createRadialGradient(
                width / 2, height / 2, height * 0.4,
                width / 2, height / 2, height
            );
            v.addColorStop(0, "rgba(0,0,0,0)");
            v.addColorStop(1, "rgba(0,0,0,0.4)");
            vignetteCtx.fillStyle = v;
            vignetteCtx.fillRect(0, 0, width, height);
        }
    }

    if (theme === "travel") {
        // 비네팅 (travel용 - 약간 다른 스타일)
        cache.vignetteCanvas = document.createElement('canvas');
        cache.vignetteCanvas.width = width;
        cache.vignetteCanvas.height = height;
        const ctx = cache.vignetteCanvas.getContext('2d');
        if (ctx) {
            const v = ctx.createRadialGradient(
                width / 2, height / 2, height * 0.5,
                width / 2, height / 2, height
            );
            v.addColorStop(0, "rgba(0,0,0,0)");
            v.addColorStop(1, "rgba(0,0,0,0.3)");
            ctx.fillStyle = v;
            ctx.fillRect(0, 0, width, height);
        }
    }

    return cache;
}

/**
 * 테마 오버레이 캐시를 정리합니다.
 * 메모리 해제를 위해 캔버스 크기를 0으로 설정합니다.
 * 
 * @param cache - 정리할 테마 오버레이 캐시
 */
export function cleanupThemeCache(cache: ThemeOverlayCache): void {
    if (cache.sepiaCanvas) {
        cache.sepiaCanvas.width = 0;
        cache.sepiaCanvas.height = 0;
    }
    if (cache.vignetteCanvas) {
        cache.vignetteCanvas.width = 0;
        cache.vignetteCanvas.height = 0;
    }
}
