/**
 * LuvMoment Layout Renderers
 * 
 * 다양한 레이아웃 스타일로 에셋을 캔버스에 렌더링하는 함수들
 */

import type { LayoutType, LayoutVariant } from '../types';
import { getSourceDimensions } from '../assetLoader';

// ============================================
// 레이아웃: Full (화면 가득 채우기)
// ============================================

/**
 * 이미지/영상을 캔버스 전체에 가득 채워 렌더링합니다.
 * 종횡비를 유지하며 cover 방식으로 그립니다.
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param source - 이미지 또는 영상 소스
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param scale - 스케일 (기본값 1)
 * @param panX - X축 패닝 오프셋 (기본값 0)
 */
export function drawLayoutFull(
    ctx: CanvasRenderingContext2D,
    source: HTMLImageElement | HTMLVideoElement,
    width: number,
    height: number,
    scale: number = 1,
    panX: number = 0
): void {
    const { width: srcWidth, height: srcHeight } = getSourceDimensions(source);
    const imgRatio = srcWidth / srcHeight;
    const canvasRatio = width / height;
    let dw: number, dh: number, dx: number, dy: number;

    if (imgRatio > canvasRatio) {
        dh = height;
        dw = height * imgRatio;
        dx = (width - dw) / 2;
        dy = 0;
    } else {
        dw = width;
        dh = width / imgRatio;
        dx = 0;
        dy = (height - dh) / 2;
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2 + panX, -height / 2);
    ctx.drawImage(source, dx, dy, dw, dh);
    ctx.restore();
}

// ============================================
// 레이아웃: Blurred (블러 배경 + 중앙 이미지)
// ============================================

/**
 * 블러 배경 위에 이미지/영상을 중앙에 배치하여 렌더링합니다.
 * 세로형/가로형에 따라 다른 처리를 적용합니다.
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param source - 이미지 또는 영상 소스
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param scale - 스케일 (기본값 1)
 * @param variant - 레이아웃 변형 ('normal' | 'crop')
 * @param blurredBg - 사전 생성된 블러 배경 캔버스 (선택)
 */
export function drawLayoutBlurred(
    ctx: CanvasRenderingContext2D,
    source: HTMLImageElement | HTMLVideoElement,
    width: number,
    height: number,
    scale: number = 1,
    variant?: LayoutVariant,
    blurredBg?: HTMLCanvasElement
): void {
    const { width: srcWidth, height: srcHeight } = getSourceDimensions(source);
    const imgRatio = srcWidth / srcHeight;
    const isLandscape = imgRatio > 1.0;

    // 가로 이미지 + crop 변형인 경우 별도 처리
    if (isLandscape && variant === 'crop') {
        drawLayoutBlurredCrop(ctx, source, width, height, scale);
        return;
    }

    // 배경 (사전 생성된 블러 캔버스 사용)
    if (blurredBg) {
        ctx.drawImage(blurredBg, 0, 0);
    } else {
        // 폴백: 실시간 블러 (성능 저하 가능)
        ctx.save();
        ctx.filter = "blur(40px) brightness(0.5)";
        drawLayoutFull(ctx, source, width, height, 1.2);
        ctx.filter = "none";
        ctx.restore();
    }

    // 전경 (Fit)
    const canvasRatio = width / height;
    let dw: number, dh: number;
    const padding = 0.85;

    if (imgRatio > canvasRatio) {
        dw = width * padding;
        dh = dw / imgRatio;
    } else {
        dh = height * padding;
        dw = dh * imgRatio;
    }

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.drawImage(source, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
}

/**
 * 가로 이미지를 세로 화면에 맞게 크롭하여 렌더링합니다.
 * 블러 배경 + 중앙 크롭 방식.
 */
export function drawLayoutBlurredCrop(
    ctx: CanvasRenderingContext2D,
    source: HTMLImageElement | HTMLVideoElement,
    width: number,
    height: number,
    scale: number = 1
): void {
    const { width: srcWidth, height: srcHeight } = getSourceDimensions(source);
    
    // 블러 배경
    ctx.save();
    ctx.filter = "blur(50px) brightness(0.4)";
    const bgWidth = width * 1.5;
    const bgHeight = bgWidth / (srcWidth / srcHeight);
    ctx.drawImage(source, (width - bgWidth) / 2, (height - bgHeight) / 2, bgWidth, bgHeight);
    ctx.filter = "none";
    ctx.restore();

    // 중앙 크롭
    const targetRatio = width / height;
    const cropHeight = srcHeight;
    const cropWidth = cropHeight * targetRatio;
    const cropX = (srcWidth - cropWidth) / 2;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;
    ctx.drawImage(
        source,
        cropX, 0, cropWidth, cropHeight,
        -width / 2, -height / 2, width, height
    );
    ctx.restore();
}

// ============================================
// 레이아웃: Split (2분할 레이아웃)
// ============================================

/**
 * 화면을 상하로 2분할하여 두 개의 이미지/영상을 렌더링합니다.
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param source1 - 상단 소스
 * @param source2 - 하단 소스
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param scale - 스케일 (기본값 1)
 */
export function drawLayoutSplit(
    ctx: CanvasRenderingContext2D,
    source1: HTMLImageElement | HTMLVideoElement,
    source2: HTMLImageElement | HTMLVideoElement,
    width: number,
    height: number,
    scale: number = 1
): void {
    const halfHeight = height / 2;
    const gap = 4;

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(scale, scale);
    ctx.translate(-width / 2, -height / 2);

    // 상단 이미지
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, width, halfHeight - gap);
    ctx.clip();
    drawCenterCrop(ctx, source1, 0, 0, width, halfHeight - gap);
    ctx.restore();

    // 하단 이미지
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, halfHeight + gap, width, halfHeight - gap);
    ctx.clip();
    drawCenterCrop(ctx, source2, 0, halfHeight + gap, width, halfHeight - gap);
    ctx.restore();

    ctx.restore();
}

// ============================================
// 유틸리티: 중앙 크롭 렌더링
// ============================================

/**
 * 이미지/영상을 지정된 영역에 중앙 크롭하여 렌더링합니다.
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param source - 이미지 또는 영상 소스
 * @param x - 타겟 X 좌표
 * @param y - 타겟 Y 좌표
 * @param w - 타겟 너비
 * @param h - 타겟 높이
 */
export function drawCenterCrop(
    ctx: CanvasRenderingContext2D,
    source: HTMLImageElement | HTMLVideoElement,
    x: number,
    y: number,
    w: number,
    h: number
): void {
    const { width: srcWidth, height: srcHeight } = getSourceDimensions(source);
    const imgRatio = srcWidth / srcHeight;
    const targetRatio = w / h;
    let sw: number, sh: number, sx: number, sy: number;

    if (imgRatio > targetRatio) {
        sh = srcHeight;
        sw = srcHeight * targetRatio;
        sx = (srcWidth - sw) / 2;
        sy = 0;
    } else {
        sw = srcWidth;
        sh = srcWidth / targetRatio;
        sx = 0;
        sy = (srcHeight - sh) / 2;
    }
    ctx.drawImage(source, sx, sy, sw, sh, x, y, w, h);
}

// ============================================
// 레이아웃 디스패처
// ============================================

export interface LayoutDrawOptions {
    ctx: CanvasRenderingContext2D;
    source: HTMLImageElement | HTMLVideoElement;
    width: number;
    height: number;
    scale?: number;
    panX?: number;
    variant?: LayoutVariant;
    blurredBg?: HTMLCanvasElement;
    pairSource?: HTMLImageElement | HTMLVideoElement;
}

/**
 * 레이아웃 타입에 따라 적절한 렌더링 함수를 호출합니다.
 */
export function drawLayout(layout: LayoutType, options: LayoutDrawOptions): void {
    const { ctx, source, width, height, scale = 1, panX = 0, variant, blurredBg, pairSource } = options;

    switch (layout) {
        case 'full':
            drawLayoutFull(ctx, source, width, height, scale, panX);
            break;
        case 'blurred':
            drawLayoutBlurred(ctx, source, width, height, scale, variant, blurredBg);
            break;
        case 'split':
            if (pairSource) {
                drawLayoutSplit(ctx, source, pairSource, width, height, scale);
            } else {
                // pairSource가 없으면 blurred로 폴백
                drawLayoutBlurred(ctx, source, width, height, scale, variant, blurredBg);
            }
            break;
    }
}
