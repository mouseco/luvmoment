/**
 * LuvMoment Atmosphere Effects
 * 
 * 테마별 감성 오버레이 효과 렌더러
 */

import type { ThemeType, ThemeOverlayCache } from './types';

// ============================================
// 테마별 분위기 효과 적용
// ============================================

/**
 * 테마에 따른 분위기 오버레이를 적용합니다.
 * 
 * - love: 핑크/오렌지 라이트 리크 (동적)
 * - anniversary: 세피아 + 비네팅 (정적, 캐시 사용)
 * - travel: 렌즈 플레어 + 비네팅 (동적 + 정적)
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param theme - 테마 타입
 * @param time - 현재 시간 (ms) - 동적 효과에 사용
 * @param cache - 사전 렌더링된 오버레이 캐시
 */
export function applyAtmosphere(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    theme: ThemeType,
    time: number,
    cache: ThemeOverlayCache
): void {
    // 모든 테마에서 ctx 상태 변경 후 즉시 복원하여 안정성 확보
    ctx.save();

    switch (theme) {
        case "love":
            applyLoveAtmosphere(ctx, width, height, time);
            break;
        case "anniversary":
            applyAnniversaryAtmosphere(ctx, cache);
            break;
        case "travel":
            applyTravelAtmosphere(ctx, width, height, time, cache);
            break;
    }

    ctx.restore(); // 모든 상태 복원 (globalCompositeOperation, globalAlpha 등)
}

// ============================================
// Love 테마: Light Leak 효과
// ============================================

/**
 * Love 테마 분위기 효과
 * 부드러운 핑크/오렌지 라이트 리크 (동적)
 */
function applyLoveAtmosphere(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number
): void {
    const t = time * 0.0005;
    const x = Math.sin(t) * width * 0.5 + width * 0.5;
    const y = Math.cos(t * 0.7) * height * 0.5 + height * 0.5;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, width * 0.8);
    gradient.addColorStop(0, "rgba(255, 182, 193, 0.35)");
    gradient.addColorStop(0.5, "rgba(255, 218, 185, 0.15)");
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

// ============================================
// Anniversary 테마: 세피아 + 비네팅
// ============================================

/**
 * Anniversary 테마 분위기 효과
 * 사전 렌더링된 세피아 + 비네팅 (정적, 캐시 사용)
 */
function applyAnniversaryAtmosphere(
    ctx: CanvasRenderingContext2D,
    cache: ThemeOverlayCache
): void {
    // 사전 렌더링된 세피아 적용
    if (cache.sepiaCanvas) {
        ctx.globalCompositeOperation = "overlay";
        ctx.drawImage(cache.sepiaCanvas, 0, 0);
    }

    // 사전 렌더링된 비네팅 적용
    if (cache.vignetteCanvas) {
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(cache.vignetteCanvas, 0, 0);
    }
}

// ============================================
// Travel 테마: 렌즈 플레어 + 비네팅
// ============================================

/**
 * Travel 테마 분위기 효과
 * 렌즈 플레어 (동적) + 비네팅 (캐시)
 */
function applyTravelAtmosphere(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    time: number,
    cache: ThemeOverlayCache
): void {
    const t = time * 0.0003;
    const sunX = (Math.sin(t) + 1) / 2 * width;
    const sunY = height * 0.2;

    ctx.globalCompositeOperation = "screen";

    // Main Flare - 단순화된 그라디언트
    const flare = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 180);
    flare.addColorStop(0, "rgba(255, 255, 224, 0.6)");
    flare.addColorStop(0.6, "rgba(255, 165, 0, 0.2)");
    flare.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = flare;
    ctx.fillRect(0, 0, width, height);

    // 캐시된 비네팅 적용
    if (cache.vignetteCanvas) {
        ctx.globalCompositeOperation = "multiply";
        ctx.drawImage(cache.vignetteCanvas, 0, 0);
    }
}

// ============================================
// 추가 분위기 효과 유틸리티
// ============================================

/**
 * 어두운 오버레이를 적용합니다.
 * 페이드 인/아웃 효과에 사용됩니다.
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param alpha - 오버레이 투명도 (0.0 ~ 1.0)
 */
export function applyDarkOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    alpha: number
): void {
    if (alpha <= 0) return;
    
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${Math.min(1, alpha)})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

/**
 * 밝은 오버레이를 적용합니다.
 * 플래시 효과에 사용됩니다.
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param alpha - 오버레이 투명도 (0.0 ~ 1.0)
 */
export function applyLightOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    alpha: number
): void {
    if (alpha <= 0) return;
    
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, alpha)})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

/**
 * 그라디언트 비네팅을 실시간으로 그립니다.
 * (캐시가 없을 때 폴백용)
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param intensity - 비네팅 강도 (0.0 ~ 1.0)
 */
export function drawVignette(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    intensity: number = 0.3
): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(width, height) * 0.7;

    const gradient = ctx.createRadialGradient(
        centerX, centerY, radius * 0.3,
        centerX, centerY, radius
    );
    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);

    ctx.save();
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}
