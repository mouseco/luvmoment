/**
 * LuvMoment Intro Renderers
 * 
 * 영상 시작 부분의 인트로 애니메이션 렌더러들
 */

import type { IntroType } from '../types';

// ============================================
// 공통 이징 함수
// ============================================

/** 부드러운 감속 (Cubic) */
function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}

/** 더 강한 감속 (Quart) */
function easeOutQuart(x: number): number {
    return 1 - Math.pow(1 - x, 4);
}

/** 탄력있는 감속 (Back) */
function easeOutBack(x: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// ============================================
// 시네마틱 인트로 (Cinematic)
// ============================================

/**
 * 시네마틱 인트로 렌더링
 * 가운데 라인이 펼쳐지고 위아래에서 텍스트가 등장하는 효과
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param progress - 인트로 진행률 (0.0 ~ 1.0)
 * @param title - 메인 타이틀
 * @param subtitle - 서브 타이틀
 */
export function drawCinematicIntro(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number,
    title: string = "Our Story",
    subtitle: string = "Special Moments"
): void {
    const centerX = width / 2;
    const centerY = height / 2;

    const t = easeOutCubic(progress);

    ctx.save();

    // 어두운 오버레이 (점점 밝아짐)
    const overlayAlpha = Math.max(0, 0.6 - progress * 0.6);
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // 1. 가운데 라인 애니메이션 (좌우로 펼쳐짐)
    const lineWidth = Math.round(width * 0.6 * t);
    const lineY = Math.round(centerY);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Math.round(centerX - lineWidth / 2), lineY);
    ctx.lineTo(Math.round(centerX + lineWidth / 2), lineY);
    ctx.stroke();

    // 2. 텍스트 애니메이션 (위아래에서 등장)
    ctx.textAlign = "center";
    ctx.fillStyle = "white";

    // 메인 타이틀 (선 위로 올라옴) - 좌표 정수화로 떨림 방지
    const titleY = Math.round(centerY - 30 + 20 * (1 - t));
    ctx.font = "bold 80px 'Times New Roman', serif";
    ctx.globalAlpha = Math.min(1, t * 1.5);
    ctx.fillText(title, Math.round(centerX), titleY);

    // 서브 타이틀 (선 아래로 내려감) - 좌표 정수화
    const subY = Math.round(centerY + 50 - 20 * (1 - t));
    ctx.font = "30px sans-serif";
    // letterSpacing은 최신 브라우저에서 지원되는 비표준 속성
    if ('letterSpacing' in ctx) {
        ctx.letterSpacing = "4px";
    }
    ctx.fillText(subtitle.toUpperCase(), Math.round(centerX), subY);

    ctx.globalAlpha = 1;
    if ('letterSpacing' in ctx) {
        ctx.letterSpacing = "0px";
    }
    ctx.restore();
}

// ============================================
// 로맨틱 인트로 (Romantic)
// ============================================

/**
 * 로맨틱 인트로 렌더링
 * 글자가 좌우로 퍼져있다가 중앙으로 모이는 효과 + 코너 장식
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param progress - 인트로 진행률 (0.0 ~ 1.0)
 * @param title - 메인 타이틀
 * @param subtitle - 서브 타이틀
 */
export function drawRomanticIntro(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number,
    title: string = "Romantic Moment",
    subtitle: string = "With You"
): void {
    const centerX = width / 2;
    const centerY = height / 2;

    const t = easeOutQuart(Math.min(progress * 1.5, 1));
    const fadeOut = progress > 0.7 ? (progress - 0.7) / 0.3 : 0;

    ctx.save();

    // 어두운 오버레이 (점점 밝아짐)
    const overlayAlpha = Math.max(0, 0.5 - progress * 0.4);
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
    ctx.fillRect(0, 0, width, height);

    // === 상단 장식 라인 ===
    const lineAlpha = Math.min(1, progress * 2) * (1 - fadeOut);
    ctx.strokeStyle = `rgba(255, 150, 170, ${lineAlpha * 0.8})`;
    ctx.lineWidth = 2;

    // 상단 코너 라인 (왼쪽)
    const cornerSize = 60 * t;
    ctx.beginPath();
    ctx.moveTo(40, 80 + cornerSize);
    ctx.lineTo(40, 80);
    ctx.lineTo(40 + cornerSize, 80);
    ctx.stroke();

    // 상단 코너 라인 (오른쪽)
    ctx.beginPath();
    ctx.moveTo(width - 40, 80 + cornerSize);
    ctx.lineTo(width - 40, 80);
    ctx.lineTo(width - 40 - cornerSize, 80);
    ctx.stroke();

    // 하단 코너 라인 (왼쪽)
    ctx.beginPath();
    ctx.moveTo(40, height - 80 - cornerSize);
    ctx.lineTo(40, height - 80);
    ctx.lineTo(40 + cornerSize, height - 80);
    ctx.stroke();

    // 하단 코너 라인 (오른쪽)
    ctx.beginPath();
    ctx.moveTo(width - 40, height - 80 - cornerSize);
    ctx.lineTo(width - 40, height - 80);
    ctx.lineTo(width - 40 - cornerSize, height - 80);
    ctx.stroke();

    // === 글자 모이는 애니메이션 ===
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 58px 'Georgia', serif";

    const textAlpha = Math.min(1, progress * 2) * (1 - fadeOut);
    ctx.fillStyle = `rgba(255, 130, 150, ${textAlpha})`;

    // 각 글자를 개별적으로 그리기 (산개 → 수렴)
    const chars = title.split('');
    const totalWidth = ctx.measureText(title).width;
    const startX = centerX - totalWidth / 2;

    let currentX = startX;
    chars.forEach((char, i) => {
        const charWidth = ctx.measureText(char).width;
        const baseX = currentX + charWidth / 2;

        // 산개 오프셋 (양쪽으로 퍼짐)
        const spreadAmount = (i - chars.length / 2) * 40 * (1 - t);
        const finalX = baseX + spreadAmount;
        const finalY = centerY - 20;

        ctx.fillText(char, finalX, finalY);
        currentX += charWidth;
    });

    // 서브타이틀 (중앙 아래, 약간 늦게 등장)
    const subProgress = Math.max(0, (progress - 0.2) * 1.25);
    const subAlpha = Math.min(1, subProgress) * (1 - fadeOut);
    ctx.globalAlpha = subAlpha;
    ctx.font = "24px 'Verdana', sans-serif";
    ctx.fillStyle = `rgba(255, 255, 255, ${subAlpha * 0.9})`;
    if ('letterSpacing' in ctx) {
        ctx.letterSpacing = "6px";
    }
    ctx.fillText(subtitle.toUpperCase(), centerX, centerY + 50);

    // 가운데 장식 라인 (타이틀 위)
    ctx.globalAlpha = lineAlpha;
    ctx.strokeStyle = `rgba(255, 200, 210, ${lineAlpha * 0.6})`;
    ctx.lineWidth = 1;
    const decorLineWidth = 100 * t;
    ctx.beginPath();
    ctx.moveTo(centerX - decorLineWidth / 2, centerY - 60);
    ctx.lineTo(centerX + decorLineWidth / 2, centerY - 60);
    ctx.stroke();

    ctx.restore();
}

// ============================================
// 트래블 인트로 (Travel/Adventure)
// ============================================

/**
 * 트래블 인트로 렌더링
 * 역동적인 줌인 + 나침반 모티브 + 여행 분위기
 * 
 * @param ctx - 캔버스 렌더링 컨텍스트
 * @param width - 캔버스 너비
 * @param height - 캔버스 높이
 * @param progress - 인트로 진행률 (0.0 ~ 1.0)
 * @param title - 메인 타이틀
 * @param subtitle - 서브 타이틀
 */
export function drawTravelIntro(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progress: number,
    title: string = "Adventure",
    subtitle: string = "Our Journey"
): void {
    const centerX = width / 2;
    const centerY = height / 2;

    const t = easeOutBack(Math.min(progress * 1.2, 1));
    const fadeOut = progress > 0.75 ? (progress - 0.75) / 0.25 : 0;

    ctx.save();

    // 어두운 오버레이
    const overlayAlpha = Math.max(0, 0.6 - progress * 0.5);
    ctx.fillStyle = `rgba(0, 0, 0, ${overlayAlpha})`;
    ctx.fillRect(0, 0, width, height);

    const lineAlpha = Math.min(1, progress * 2) * (1 - fadeOut);

    // === 상단 프레임 라인 ===
    ctx.strokeStyle = `rgba(78, 205, 196, ${lineAlpha})`;
    ctx.lineWidth = 3;

    // 상단 가로 라인 (펼쳐지는 효과)
    const topLineWidth = (width - 80) * t;
    ctx.beginPath();
    ctx.moveTo(centerX - topLineWidth / 2, 60);
    ctx.lineTo(centerX + topLineWidth / 2, 60);
    ctx.stroke();

    // 하단 가로 라인
    ctx.beginPath();
    ctx.moveTo(centerX - topLineWidth / 2, height - 60);
    ctx.lineTo(centerX + topLineWidth / 2, height - 60);
    ctx.stroke();

    // === 나침반 원형 장식 ===
    ctx.strokeStyle = `rgba(78, 205, 196, ${lineAlpha * 0.5})`;
    ctx.lineWidth = 2;

    // 외부 원 (회전)
    const rotation = progress * Math.PI * 0.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 100, 40 * t, rotation, rotation + Math.PI * 1.5);
    ctx.stroke();

    // 내부 원
    ctx.beginPath();
    ctx.arc(centerX, centerY - 100, 25 * t, 0, Math.PI * 2);
    ctx.stroke();

    // 나침반 바늘 (N 방향)
    ctx.fillStyle = `rgba(255, 107, 107, ${lineAlpha})`;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 100 - 20 * t);
    ctx.lineTo(centerX - 6 * t, centerY - 100);
    ctx.lineTo(centerX + 6 * t, centerY - 100);
    ctx.closePath();
    ctx.fill();

    // === 메인 타이틀 (줌인 효과) ===
    const textAlpha = Math.min(1, progress * 2) * (1 - fadeOut);
    const scale = 0.5 + t * 0.5;

    ctx.save();
    ctx.translate(centerX, centerY + 20);
    ctx.scale(scale, scale);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 72px 'Arial', sans-serif";
    ctx.fillStyle = `rgba(255, 255, 255, ${textAlpha})`;
    if ('letterSpacing' in ctx) {
        ctx.letterSpacing = "8px";
    }
    ctx.fillText(title.toUpperCase(), 0, 0);

    ctx.restore();

    // === 서브타이틀 ===
    const subProgress = Math.max(0, (progress - 0.3) * 1.4);
    const subAlpha = Math.min(1, subProgress) * (1 - fadeOut);
    ctx.globalAlpha = subAlpha;
    ctx.font = "20px 'Verdana', sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = `rgba(78, 205, 196, ${subAlpha})`;
    if ('letterSpacing' in ctx) {
        ctx.letterSpacing = "10px";
    }
    ctx.fillText(subtitle.toUpperCase(), centerX, centerY + 90);

    // === 세로 장식 라인 (양쪽) ===
    ctx.globalAlpha = lineAlpha * 0.4;
    ctx.strokeStyle = `rgba(78, 205, 196, 1)`;
    ctx.lineWidth = 1;

    const vertLineHeight = 150 * t;
    // 왼쪽 세로 라인
    ctx.beginPath();
    ctx.moveTo(60, centerY - vertLineHeight / 2);
    ctx.lineTo(60, centerY + vertLineHeight / 2);
    ctx.stroke();

    // 오른쪽 세로 라인
    ctx.beginPath();
    ctx.moveTo(width - 60, centerY - vertLineHeight / 2);
    ctx.lineTo(width - 60, centerY + vertLineHeight / 2);
    ctx.stroke();

    ctx.restore();
}

// ============================================
// 인트로 디스패처
// ============================================

export interface IntroDrawOptions {
    ctx: CanvasRenderingContext2D;
    width: number;
    height: number;
    progress: number;
    title?: string;
    subtitle?: string;
}

/**
 * 인트로 타입에 따라 적절한 렌더링 함수를 호출합니다.
 */
export function drawIntro(introType: IntroType, options: IntroDrawOptions): void {
    const { ctx, width, height, progress, title, subtitle } = options;

    switch (introType) {
        case 'cinematic':
            drawCinematicIntro(ctx, width, height, progress, title, subtitle);
            break;
        case 'romantic':
            drawRomanticIntro(ctx, width, height, progress, title, subtitle);
            break;
        case 'travel':
            drawTravelIntro(ctx, width, height, progress, title, subtitle);
            break;
    }
}
