/**
 * LuvMoment Transition Effects
 * 
 * 슬라이드 간 전환 효과 렌더러들
 */

import type { TransitionType, SlideDirection, TransitionOffset, ZoomTransitionResult } from '../types';

// ============================================
// 전환 효과 선택
// ============================================

/**
 * BPM에 따라 적절한 전환 효과를 선택합니다.
 * 높은 BPM = 역동적인 전환, 낮은 BPM = 부드러운 전환
 * 
 * @param bpm - 음악의 BPM
 * @param index - 슬라이드 인덱스 (다양성을 위해 사용)
 * @returns 선택된 전환 효과 타입
 */
export function selectTransition(bpm: number, index: number): TransitionType {
    const transitions: TransitionType[] = bpm > 120
        ? ["slideLeft", "slideUp", "zoom", "wipe", "flash", "slideRight", "slideDown"]  // 경쾌
        : ["fade", "slideLeft", "zoom", "slideRight", "fade"];  // 잔잔

    return transitions[index % transitions.length];
}

// ============================================
// 전환 진행률 계산
// ============================================

/**
 * 전환 진행률을 계산합니다.
 * 슬라이드 시작 부분에서만 전환이 적용됩니다.
 * 
 * @param timeInSlide - 현재 슬라이드 내 경과 시간 (ms)
 * @param transitionDuration - 전환 지속 시간 (ms)
 * @returns 진행률 (0.0 ~ 1.0)
 */
export function getTransitionProgress(timeInSlide: number, transitionDuration: number): number {
    if (timeInSlide >= transitionDuration) return 1;
    return timeInSlide / transitionDuration;
}

// ============================================
// Fade 전환
// ============================================

/**
 * Fade 전환 효과
 * 이전 슬라이드 위에 새 슬라이드가 페이드인
 * 
 * @param progress - 전환 진행률 (0.0 ~ 1.0)
 * @returns 새 슬라이드의 투명도 (0 → 1)
 */
export function applyFadeTransition(progress: number): number {
    return Math.min(1, progress * 1.5);
}

// ============================================
// Slide 전환
// ============================================

/**
 * Slide 전환 효과
 * 새 슬라이드가 특정 방향에서 밀려들어옴
 * 
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param progress - 전환 진행률 (0.0 ~ 1.0)
 * @param direction - 슬라이드 방향
 * @returns 오프셋 좌표 { offsetX, offsetY }
 */
export function applySlideTransition(
    width: number,
    height: number,
    progress: number,
    direction: SlideDirection
): TransitionOffset {
    const easeOut = 1 - Math.pow(1 - progress, 3); // Ease-out cubic

    switch (direction) {
        case "left":
            return { offsetX: width * (1 - easeOut), offsetY: 0 };
        case "right":
            return { offsetX: -width * (1 - easeOut), offsetY: 0 };
        case "up":
            return { offsetX: 0, offsetY: height * (1 - easeOut) };
        case "down":
            return { offsetX: 0, offsetY: -height * (1 - easeOut) };
    }
}

// ============================================
// Zoom 전환
// ============================================

/**
 * Zoom 전환 효과
 * 새 슬라이드가 확대되면서 등장
 * 
 * @param progress - 전환 진행률 (0.0 ~ 1.0)
 * @returns { scale, alpha } 스케일과 투명도
 */
export function applyZoomTransition(progress: number): ZoomTransitionResult {
    const easeOut = 1 - Math.pow(1 - progress, 2);
    return {
        scale: 0.5 + easeOut * 0.5, // 0.5 → 1.0
        alpha: easeOut
    };
}

// ============================================
// Wipe 전환
// ============================================

/**
 * Wipe 전환 효과
 * 한쪽에서 닦아내듯이 전환 (클리핑 적용)
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param progress - 전환 진행률 (0.0 ~ 1.0)
 */
export function applyWipeTransition(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number
): void {
    const easeOut = 1 - Math.pow(1 - progress, 2);
    const wipeX = width * easeOut;

    // 클리핑 영역 설정 (왼쪽에서 오른쪽으로 닦아내기)
    ctx.beginPath();
    ctx.rect(0, 0, wipeX, height);
    ctx.clip();
}

// ============================================
// Flash 전환
// ============================================

/**
 * Flash 전환 효과
 * 흰색 플래시 후 새 슬라이드
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param progress - 전환 진행률 (0.0 ~ 1.0)
 */
export function applyFlashTransition(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number
): void {
    // 0~0.3: 플래시 밝아짐, 0.3~1.0: 플래시 사라짐
    let flashAlpha = 0;
    if (progress < 0.3) {
        flashAlpha = progress / 0.3;
    } else {
        flashAlpha = 1 - (progress - 0.3) / 0.7;
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${flashAlpha * 0.8})`;
    ctx.fillRect(0, 0, width, height);
}

// ============================================
// 전환 효과 적용 헬퍼
// ============================================

export interface TransitionApplyOptions {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    progress: number;
    transitionType: TransitionType;
}

export interface TransitionApplyResult {
    alpha: number;
    offsetX: number;
    offsetY: number;
    scale: number;
    needsClip: boolean;
}

/**
 * 전환 타입에 따라 적절한 효과를 계산합니다.
 * 
 * @returns 전환 적용 결과 (alpha, offset, scale 등)
 */
export function calculateTransitionParams(
    transitionType: TransitionType,
    width: number,
    height: number,
    progress: number
): TransitionApplyResult {
    const result: TransitionApplyResult = {
        alpha: 1,
        offsetX: 0,
        offsetY: 0,
        scale: 1,
        needsClip: false
    };

    switch (transitionType) {
        case "cut":
            // 즉시 전환, 변환 없음
            break;
        case "fade":
            result.alpha = applyFadeTransition(progress);
            break;
        case "slideLeft": {
            const offset = applySlideTransition(width, height, progress, "left");
            result.offsetX = offset.offsetX;
            result.offsetY = offset.offsetY;
            break;
        }
        case "slideRight": {
            const offset = applySlideTransition(width, height, progress, "right");
            result.offsetX = offset.offsetX;
            result.offsetY = offset.offsetY;
            break;
        }
        case "slideUp": {
            const offset = applySlideTransition(width, height, progress, "up");
            result.offsetX = offset.offsetX;
            result.offsetY = offset.offsetY;
            break;
        }
        case "slideDown": {
            const offset = applySlideTransition(width, height, progress, "down");
            result.offsetX = offset.offsetX;
            result.offsetY = offset.offsetY;
            break;
        }
        case "zoom": {
            const zoom = applyZoomTransition(progress);
            result.scale = zoom.scale;
            result.alpha = zoom.alpha;
            break;
        }
        case "wipe":
            result.needsClip = true;
            break;
        case "flash":
            // Flash는 후처리로 적용됨
            break;
    }

    return result;
}
