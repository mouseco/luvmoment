/**
 * BPM Analyzer
 * 
 * 오디오 버퍼에서 BPM을 분석하고 비트 타이밍을 생성합니다.
 * Peak Detection 알고리즘을 사용하여 베이스/킥 드럼 위주로 분석합니다.
 */

import { VIDEO_CONFIG } from './types';

/**
 * 오디오 버퍼에서 BPM을 분석합니다.
 * - Peak Detection 알고리즘 사용
 * - 추후 AI 생성 음악에도 동일하게 적용 가능
 * 
 * @param audioBuffer - 분석할 오디오 버퍼
 * @returns 분석된 BPM (60-180 범위로 정규화됨)
 */
export async function analyzeBPM(audioBuffer: AudioBuffer): Promise<number> {
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // 1. Low-pass filter를 위한 다운샘플링 (베이스/킥 드럼 위주 분석)
    const downsampleFactor = Math.floor(sampleRate / 200); // ~200Hz로 다운샘플
    const samples: number[] = [];

    for (let i = 0; i < channelData.length; i += downsampleFactor) {
        let sum = 0;
        const end = Math.min(i + downsampleFactor, channelData.length);
        for (let j = i; j < end; j++) {
            sum += Math.abs(channelData[j]);
        }
        samples.push(sum / downsampleFactor);
    }

    // 2. Peak Detection (에너지 기반)
    const peaks: number[] = [];
    const windowSize = 10;
    const threshold = 1.3; // 평균 대비 30% 이상이면 피크

    for (let i = windowSize; i < samples.length - windowSize; i++) {
        let windowSum = 0;
        for (let j = i - windowSize; j < i + windowSize; j++) {
            windowSum += samples[j];
        }
        const windowAvg = windowSum / (windowSize * 2);

        if (samples[i] > windowAvg * threshold && samples[i] > samples[i - 1] && samples[i] > samples[i + 1]) {
            peaks.push(i);
        }
    }

    // 3. 피크 간격으로 BPM 계산
    if (peaks.length < 2) {
        console.log("⚠️ Not enough peaks detected, using default BPM", VIDEO_CONFIG.DEFAULT_BPM);
        return VIDEO_CONFIG.DEFAULT_BPM;
    }

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
        intervals.push(peaks[i] - peaks[i - 1]);
    }

    // 가장 흔한 간격 찾기 (히스토그램)
    const intervalCounts = new Map<number, number>();
    const tolerance = 2;

    for (const interval of intervals) {
        const roundedInterval = Math.round(interval / tolerance) * tolerance;
        intervalCounts.set(roundedInterval, (intervalCounts.get(roundedInterval) || 0) + 1);
    }

    let maxCount = 0;
    let dominantInterval = intervals[0];
    intervalCounts.forEach((count, interval) => {
        if (count > maxCount) {
            maxCount = count;
            dominantInterval = interval;
        }
    });

    // 다운샘플된 인덱스를 실제 시간으로 변환
    const effectiveSampleRate = sampleRate / downsampleFactor;
    const intervalSeconds = dominantInterval / effectiveSampleRate;
    const bpm = Math.round(60 / intervalSeconds);

    // BPM 범위 보정 (60~180 사이로)
    let finalBpm = bpm;
    while (finalBpm > VIDEO_CONFIG.MAX_BPM) finalBpm /= 2;
    while (finalBpm < VIDEO_CONFIG.MIN_BPM) finalBpm *= 2;

    console.log(`🎵 Detected BPM: ${finalBpm}`);
    return finalBpm;
}

/**
 * BPM과 총 시간을 기반으로 비트 타이밍 배열을 생성합니다.
 * 
 * @param bpm - 분당 비트 수
 * @param totalDurationMs - 총 시간 (ms)
 * @param beatsPerSlide - 슬라이드당 비트 수 (기본: 4비트 = 1마디)
 * @returns 각 슬라이드 시작 시간의 배열 (ms)
 */
export function generateBeatTimings(
    bpm: number,
    totalDurationMs: number,
    beatsPerSlide: number = 4
): number[] {
    const beatIntervalMs = (60 / bpm) * 1000; // 1비트 간격 (ms)
    const slideIntervalMs = beatIntervalMs * beatsPerSlide; // 슬라이드 간격

    const timestamps: number[] = [];
    let currentTime = 0;

    while (currentTime < totalDurationMs) {
        timestamps.push(currentTime);
        currentTime += slideIntervalMs;
    }

    console.log(`🥁 Beat timings: ${timestamps.length} slides @ ${bpm} BPM (${beatsPerSlide} beats/slide)`);
    return timestamps;
}

/**
 * BPM에 따른 동적 파라미터를 계산합니다.
 * BPM 높으면 (경쾌한 음악): Split 확률 ↑, Ken Burns 강도 ↑
 * BPM 낮으면 (잔잔한 음악): Split 확률 ↓, Ken Burns 강도 ↓
 * 
 * @param bpm - 분당 비트 수
 * @returns 동적 파라미터 객체
 */
export function calculateDynamicParams(bpm: number): {
    splitProbability: number;
    cropProbability: number;
    kenBurnsIntensity: number;
    transitionDuration: number;
} {
    // 60~180 BPM을 0~1로 정규화
    const bpmNormalized = Math.min(1, Math.max(0, (bpm - VIDEO_CONFIG.MIN_BPM) / (VIDEO_CONFIG.MAX_BPM - VIDEO_CONFIG.MIN_BPM)));
    
    return {
        splitProbability: 0.15 + bpmNormalized * 0.35, // 15%~50%
        cropProbability: 0.3 + bpmNormalized * 0.3,    // 30%~60%
        kenBurnsIntensity: 0.05 + bpmNormalized * 0.1, // 5%~15% 줌
        transitionDuration: bpm > 120 ? 300 : 500,     // BPM 높으면 빠른 전환
    };
}
