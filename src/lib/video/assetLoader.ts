/**
 * LuvMoment Asset Loader
 * 
 * 이미지/영상 에셋 로드, 리사이징, 블러 배경 생성 유틸리티
 */

import type { AssetInput, ResizeResult } from './types';

// ============================================
// 에셋 로드
// ============================================

/**
 * 이미지 또는 영상 에셋을 로드합니다.
 * 
 * @param asset - 로드할 에셋 정보
 * @returns HTMLImageElement 또는 HTMLVideoElement
 */
export async function loadAsset(asset: AssetInput, signal?: AbortSignal): Promise<HTMLImageElement | HTMLVideoElement> {
    signal?.throwIfAborted();
    return new Promise((resolve, reject) => {
        const media = asset.type === 'image' ? new Image() : document.createElement('video');
        const readyEvent = asset.type === 'image' ? 'load' : 'loadeddata';
        if (!asset.url.startsWith('blob:')) media.crossOrigin = 'anonymous';
        if (media instanceof HTMLVideoElement) {
            media.muted = true;
            media.preload = 'auto';
            media.playsInline = true;
        }
        const cleanup = () => {
            clearTimeout(timer);
            media.removeEventListener(readyEvent, onReady);
            media.removeEventListener('error', onError);
            signal?.removeEventListener('abort', onAbort);
        };
        const release = () => {
            media.removeAttribute('src');
            if (media instanceof HTMLVideoElement) { media.pause(); media.load(); }
        };
        const onReady = () => { cleanup(); resolve(media); };
        const onError = () => {
            cleanup(); release();
            reject(new Error('사진이나 영상을 읽지 못했습니다. 지원되는 다른 파일로 다시 시도해주세요.'));
        };
        const onAbort = () => { cleanup(); release(); reject(signal?.reason); };
        const timer = setTimeout(onError, 15000);
        media.addEventListener(readyEvent, onReady, { once: true });
        media.addEventListener('error', onError, { once: true });
        signal?.addEventListener('abort', onAbort, { once: true });
        media.src = asset.url;
        if (media instanceof HTMLVideoElement) media.load();
    });
}

// ============================================
// 이미지 리사이징
// ============================================

/**
 * 필요한 경우 이미지를 타겟 크기에 맞게 리사이징합니다.
 * 
 * 현재 긴 변이 타겟의 80~100% 범위 내에 있으면 리사이징하지 않습니다.
 * 리사이징 시 JPEG 92% 품질로 변환합니다.
 * 
 * @param img - 원본 이미지
 * @param targetWidth - 목표 너비
 * @param targetHeight - 목표 높이
 * @returns 리사이징 결과 (원본 또는 새 이미지, 임시 URL)
 */
export async function resizeImageIfNeeded(
    img: HTMLImageElement,
    targetWidth: number,
    targetHeight: number
): Promise<ResizeResult> {
    const maxWidth = targetWidth * 1.5;
    const maxHeight = targetHeight * 1.5;

    const currentLongSide = Math.max(img.width, img.height);
    const targetLongSide = Math.max(maxWidth, maxHeight);

    // 현재 크기가 적절한 범위 내에 있으면 리사이징 생략
    if (currentLongSide >= targetLongSide * 0.8 && currentLongSide <= targetLongSide) {
        return { img, isResized: false };
    }

    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    const newWidth = Math.floor(img.width * scale);
    const newHeight = Math.floor(img.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) return { img, isResized: false };

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, newWidth, newHeight);

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                resolve({ img, isResized: false });
                return;
            }
            const tempUrl = URL.createObjectURL(blob);
            const newImg = new Image();
            newImg.onload = () => resolve({ img: newImg, isResized: true, tempUrl });
            newImg.onerror = () => {
                URL.revokeObjectURL(tempUrl);
                resolve({ img, isResized: false });
            };
            newImg.src = tempUrl;
        }, 'image/jpeg', 0.92);
    });
}

// ============================================
// 블러 배경 생성
// ============================================

/**
 * 블러 배경 캔버스를 사전 생성합니다.
 * 
 * 소스 이미지/영상을 1.2배 확대하고 블러+어둡게 처리하여
 * 배경으로 사용할 캔버스를 생성합니다.
 * 
 * @param source - 원본 이미지 또는 영상
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @returns 블러 처리된 배경 캔버스
 */
export async function generateBlurredCanvas(
    source: HTMLImageElement | HTMLVideoElement,
    width: number,
    height: number
): Promise<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const srcWidth = source instanceof HTMLImageElement ? source.width : source.videoWidth;
    const srcHeight = source instanceof HTMLImageElement ? source.height : source.videoHeight;
    const imgRatio = srcWidth / srcHeight;
    const canvasRatio = width / height;
    let dw: number, dh: number, dx: number, dy: number;

    const scale = 1.2;

    if (imgRatio > canvasRatio) {
        dh = height * scale;
        dw = dh * imgRatio;
        dx = (width - dw) / 2;
        dy = (height - dh) / 2;
    } else {
        dw = width * scale;
        dh = dw / imgRatio;
        dx = (width - dw) / 2;
        dy = (height - dh) / 2;
    }

    ctx.filter = "blur(40px) brightness(0.5)";
    ctx.drawImage(source, dx, dy, dw, dh);
    ctx.filter = "none";

    return canvas;
}

// ============================================
// 에셋 소스 크기 유틸리티
// ============================================

/**
 * 이미지 또는 영상의 원본 크기를 반환합니다.
 */
export function getSourceDimensions(source: HTMLImageElement | HTMLVideoElement): { width: number; height: number } {
    if (source instanceof HTMLImageElement) {
        return { width: source.width, height: source.height };
    }
    return { width: source.videoWidth, height: source.videoHeight };
}

/**
 * 이미지 또는 영상의 종횡비를 계산합니다.
 */
export function getAspectRatio(source: HTMLImageElement | HTMLVideoElement): number {
    const { width, height } = getSourceDimensions(source);
    return width / height;
}

/**
 * 세로형 에셋인지 확인합니다.
 */
export function isPortrait(source: HTMLImageElement | HTMLVideoElement): boolean {
    return getAspectRatio(source) < 1.0;
}
