/**
 * LuvMoment Video Generator
 * 
 * 사진과 영상을 조합하여 감성적인 비디오를 생성하는 메인 모듈입니다.
 * Mediabunny를 사용하여 클라이언트 사이드에서 MP4 인코딩을 수행합니다.
 */

import { Output, BufferTarget, Mp4OutputFormat, CanvasSource, AudioBufferSource, canEncodeVideo, canEncodeAudio } from "mediabunny";
import { seekVideoFrame } from './video/seekVideoFrame';
import {
    // 타입
    VideoGeneratorOptions,
    GeneratedVideo,
    AssetMeta,
    IntroType,
    LayoutType,
    
    // 모듈 함수들
    loadAsset,
    resizeImageIfNeeded,
    generateBlurredCanvas,
    analyzeBPM,
    createThemeOverlayCache,
    selectTransition,
    getTransitionProgress,
    calculateTransitionParams,
    applyWipeTransition,
    applyFlashTransition,
    drawLayout,
    drawIntro,
    applyAtmosphere,
    ResourceManager,
    
    // 상수
    VIDEO_CONFIG
} from "./video";

// ============================================
// 메인 생성 함수
// ============================================

export async function generateVideo(
    options: VideoGeneratorOptions
): Promise<GeneratedVideo> {
    const resources = new ResourceManager();
    let output: Output | null = null;

    const {
        assets,
        audioUrl,
        fps,
        theme,
        introType = 'cinematic',
        onProgress,
        enableIntro = true,
        enableOutro = true,
        introTitle,
        introSubtitle,
        signal,
    } = options;
    
    let { width, height } = options;

    // 인트로 텍스트 기본값 설정
    const defaultIntroTexts: Record<IntroType, { title: string; subtitle: string }> = {
        cinematic: { title: 'Our Story', subtitle: 'Special Moments' },
        romantic: { title: 'Romantic Moment', subtitle: 'With You' },
        travel: { title: 'Adventure', subtitle: 'Our Journey' },
    };
    const finalIntroTitle = introTitle || defaultIntroTexts[introType].title;
    const finalIntroSubtitle = introSubtitle || defaultIntroTexts[introType].subtitle;

    // 홀수 해상도 보정 (인코딩 안정성)
    width = width % 2 === 0 ? width : width - 1;
    height = height % 2 === 0 ? height : height - 1;

    console.log(`🎬 Starting MP4 video generation with ${assets.length} assets...`);
    console.log(`📐 Resolution: ${width}x${height} @ ${fps}fps`);

    type TempMeta = Omit<AssetMeta, 'duration' | 'startTimeInTimeline' | 'pairAsset'> & {
        pairAsset?: TempMeta;
    };

    try {
        signal?.throwIfAborted();
        if (!assets.length) throw new Error('사진이나 영상을 먼저 선택해주세요.');
        if (!await canEncodeVideo('avc', { width, height, bitrate: 8e6 })) {
            throw new Error('이 브라우저에서는 MP4를 만들 수 없습니다. 최신 Chrome 또는 Edge에서 다시 열어주세요.');
        }
        // 1. 에셋 로드
        console.log(`📥 Loading ${assets.length} assets...`);
        const loadedResults = await Promise.allSettled(
            assets.map(async (asset) => {
                const loaded = await loadAsset(asset, signal);
                if (loaded instanceof HTMLVideoElement) resources.addVideo(loaded);
                return loaded;
            })
        );
        const failedAsset = loadedResults.find(result => result.status === 'rejected');
        if (failedAsset?.status === 'rejected') throw failedAsset.reason;
        signal?.throwIfAborted();
        const loadedAssets = loadedResults.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);

        // 2. 이미지 최적화 (영상은 원본 사용)
        console.log(`🔧 Optimizing assets...`);
        const optimizedAssets: (HTMLImageElement | HTMLVideoElement)[] = [];
        for (let idx = 0; idx < loadedAssets.length; idx++) {
            const asset = loadedAssets[idx];
            if (asset instanceof HTMLImageElement) {
                const result = await resizeImageIfNeeded(asset, width, height);
                if (result.isResized && result.tempUrl) {
                    resources.addUrl(result.tempUrl);
                }
                optimizedAssets.push(result.img);
            } else {
                optimizedAssets.push(asset);
            }
        }

        // 3. 오디오 로드
        let audioBuffer: AudioBuffer | null = null;
        let audioDuration = 0;
        let audioContext: AudioContext | null = null;

        if (audioUrl) {
            try {
                const response = await fetch(audioUrl, { signal });
                if (!response.ok) throw new Error('BGM request failed');
                const arrayBuffer = await response.arrayBuffer();
                audioContext = new AudioContext();
                
                resources.addAudioContext(audioContext!);

                if (audioContext.state === 'suspended') {
                    await audioContext.resume();
                }

                audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                audioDuration = audioBuffer.duration * 1000;
                console.log(`🎵 Audio loaded: ${(audioDuration / 1000).toFixed(1)}s`);
            } catch (e) {
                signal?.throwIfAborted();
                throw new Error('배경음악을 불러오지 못했습니다. 연결을 확인하고 다시 시도해주세요.', { cause: e });
            }
        }

        // 4. 테마 오버레이 캐시 생성
        console.log(`🎨 Creating theme overlay cache for "${theme}"...`);
        const themeCache = createThemeOverlayCache(width, height, theme);

        // 5. BPM 분석 및 동적 파라미터 설정
        let bpm: number = VIDEO_CONFIG.DEFAULT_BPM;
        if (audioBuffer) {
            bpm = await analyzeBPM(audioBuffer);
        }
        console.log(`🎵 BPM: ${bpm}`);

        // BPM 기반 역동성 파라미터 계산
        const bpmNormalized = Math.min(1, Math.max(0, (bpm - 60) / 120));
        const splitProbability = 0.15 + bpmNormalized * 0.35; // 15%~50%
        const cropProbability = 0.3 + bpmNormalized * 0.3; // 30%~60%
        const kenBurnsIntensity = 0.05 + bpmNormalized * 0.1; // 5%~15%

        console.log(`🎬 Dynamic params: Split=${(splitProbability * 100).toFixed(0)}%, Crop=${(cropProbability * 100).toFixed(0)}%, Zoom=${(kenBurnsIntensity * 100).toFixed(0)}%`);

        // 6. 메타데이터 구성 및 레이아웃 결정
        const tempMetas: TempMeta[] = [];
        let i = 0;
        
        while (i < optimizedAssets.length) {
            const source = optimizedAssets[i];
            const srcWidth = source instanceof HTMLImageElement ? source.width : source.videoWidth;
            const srcHeight = source instanceof HTMLImageElement ? source.height : source.videoHeight;
            const aspectRatio = srcWidth / srcHeight;
            const isPortrait = aspectRatio < 0.85;

            let layout: LayoutType = "blurred";

            // Split View 처리 (이미지끼리만)
            if (source instanceof HTMLImageElement && !isPortrait && i + 1 < optimizedAssets.length) {
                const nextSource = optimizedAssets[i + 1];
                if (nextSource instanceof HTMLImageElement) {
                    const nextRatio = nextSource.width / nextSource.height;
                    const nextIsPortrait = nextRatio < 0.85;

                    if (!nextIsPortrait && Math.random() < splitProbability) {
                        const meta1: TempMeta = {
                            id: assets[i].id,
                            type: 'image',
                            img: source,
                            aspectRatio,
                            isPortrait: false,
                            layout: 'split',
                            transition: selectTransition(bpm, tempMetas.length)
                        } as TempMeta;
                        
                        const meta2: TempMeta = {
                            id: assets[i + 1].id,
                            type: 'image',
                            img: nextSource,
                            aspectRatio: nextRatio,
                            isPortrait: false,
                            layout: 'split'
                        } as TempMeta;

                        meta1.pairAsset = meta2;
                        tempMetas.push(meta1);
                        i += 2;
                        continue;
                    }
                }
            }

            // 일반 레이아웃 결정
            if (isPortrait) {
                layout = Math.random() < 0.5 ? "blurred" : "full";
            } else {
                layout = "blurred";
            }

            const layoutVariant = !isPortrait && Math.random() < cropProbability ? 'crop' : 'normal';

            tempMetas.push({
                id: assets[i].id,
                type: assets[i].type,
                img: source instanceof HTMLImageElement ? source : undefined,
                video: source instanceof HTMLVideoElement ? source : undefined,
                aspectRatio,
                isPortrait,
                layout,
                layoutVariant,
                startTimeInVideo: assets[i].startTime || 0,
                transition: selectTransition(bpm, tempMetas.length)
            } as TempMeta);
            i++;
        }

        // 7. 블러 배경 사전 생성
        console.log(`🚀 Generating blurred backgrounds...`);
        for (let idx = 0; idx < tempMetas.length; idx++) {
            const meta = tempMetas[idx] as AssetMeta;
            if (meta.layout === 'blurred') {
                const source = meta.img || meta.video!;
                if (source instanceof HTMLVideoElement) {
                    await seekVideoFrame(source, meta.startTimeInVideo || 0, signal);
                }
                meta.blurredBg = await generateBlurredCanvas(source, width, height);
            }
        }

        // 8. 타임라인 및 재생 시간 계산
        const introDuration = enableIntro ? VIDEO_CONFIG.INTRO_DURATION_MS : 0;
        const outroDuration = enableOutro ? VIDEO_CONFIG.OUTRO_DURATION_MS : 0;
        const slideCount = tempMetas.length;

        let durationPerSlide = 3000;

        if (audioBuffer && audioDuration > 0 && slideCount > 0) {
            const beatIntervalMs = (60 / bpm) * 1000;
            const availableTime = audioDuration - introDuration - outroDuration;
            const idealBeatsPerSlide = availableTime / slideCount / beatIntervalMs;
            const beatsPerSlide = Math.max(2, Math.round(idealBeatsPerSlide));
            durationPerSlide = beatIntervalMs * beatsPerSlide;
        }

        const metas: AssetMeta[] = [];
        let currentTimeCursor = 0;

        tempMetas.forEach((meta, idx) => {
            const isFirst = idx === 0;
            let slideDuration = isFirst ? introDuration + durationPerSlide : durationPerSlide;

            // 영상 길이 최적화 (Stuck 방지)
            if (meta.type === 'video' && meta.video) {
                // 시작점 보정
                if (meta.startTimeInVideo === 0 || !meta.startTimeInVideo) {
                    meta.startTimeInVideo = meta.video.duration > 1 ? meta.video.duration * 0.2 : 0;
                }

                const remainingVideoMs = (meta.video.duration - meta.startTimeInVideo) * 1000;
                if (remainingVideoMs < slideDuration) {
                    slideDuration = Math.max(1000, remainingVideoMs);
                }
            }

            metas.push({
                ...meta,
                duration: slideDuration,
                startTimeInTimeline: currentTimeCursor
            } as AssetMeta);
            currentTimeCursor += slideDuration;
        });

        const totalDuration = currentTimeCursor + outroDuration;

        console.log(`\n⏱️ Video Timeline (Total: ${(totalDuration / 1000).toFixed(1)}s):`);
        console.log(`  Slides: ${metas.length}, Duration per slide: ${(durationPerSlide / 1000).toFixed(1)}s`);

        // 9. 렌더링 준비
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d", { alpha: false })!;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 10. Mediabunny 인코더 설정
        console.log(`📦 Setting up Mediabunny MP4 encoder...`);
        
        const target = new BufferTarget();
        output = new Output({
            format: new Mp4OutputFormat(),
            target: target,
        });

        const videoSource = new CanvasSource(canvas, {
            codec: 'avc',
            bitrate: 8e6,
        });
        output.addVideoTrack(videoSource, { frameRate: fps });

        let audioSource: AudioBufferSource | null = null;
        if (audioBuffer) {
            if (!await canEncodeAudio('aac', { numberOfChannels: audioBuffer.numberOfChannels, sampleRate: audioBuffer.sampleRate })) {
                throw new Error('이 브라우저에서는 음악이 포함된 MP4를 만들 수 없습니다. 최신 Chrome 또는 Edge에서 다시 열어주세요.');
            }
            audioSource = new AudioBufferSource({
                codec: 'aac',
                bitrate: 192e3,
            });
            output.addAudioTrack(audioSource);
        }

        await output.start();

        if (audioBuffer && audioSource) {
            console.log(`🎵 Adding audio to video...`);
            const sampleCount = Math.min(audioBuffer.length, Math.round(totalDuration / 1000 * audioBuffer.sampleRate));
            const trimmedAudio = new AudioBuffer({ length: sampleCount, sampleRate: audioBuffer.sampleRate, numberOfChannels: audioBuffer.numberOfChannels });
            for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                trimmedAudio.copyToChannel(audioBuffer.getChannelData(channel).subarray(0, sampleCount), channel);
            }
            await audioSource.add(trimmedAudio);
        }

        // 11. 렌더링 루프
        console.log(`🎞️ Rendering frames...`);

        const totalFrames = Math.ceil((totalDuration / 1000) * fps);
        const msPerFrame = 1000 / fps;

        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            signal?.throwIfAborted();
            const currentTime = frameIndex * msPerFrame;

            // Clear
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, width, height);

            // A. 인트로 구간
            if (enableIntro && currentTime < introDuration) {
                if (metas.length > 0) {
                    const firstMeta = metas[0];
                    const slideProgress = currentTime / firstMeta.duration;
                    const scale = 1 + slideProgress * kenBurnsIntensity;
                    const source = firstMeta.img || firstMeta.video!;

                    // 영상 싱크
                    if (source instanceof HTMLVideoElement) {
                        await seekVideoFrame(source, (firstMeta.startTimeInVideo || 0) + (currentTime / 1000), signal);
                    }

                    // 배경 렌더링
                    drawLayout(firstMeta.layout, {
                        ctx,
                        source,
                        width,
                        height,
                        scale,
                        variant: firstMeta.layoutVariant,
                        blurredBg: firstMeta.blurredBg,
                        pairSource: firstMeta.pairAsset?.img
                    });

                    // 분위기 효과
                    applyAtmosphere(ctx, width, height, theme, currentTime, themeCache);

                    // 인트로 오버레이
                    const introProgress = currentTime / introDuration;
                    drawIntro(introType, {
                        ctx,
                        width,
                        height,
                        progress: introProgress,
                        title: finalIntroTitle,
                        subtitle: finalIntroSubtitle
                    });
                }
            }
            // B. 아웃트로 구간
            else if (enableOutro && currentTime > totalDuration - outroDuration) {
                ctx.fillStyle = "white";
                ctx.font = "bold 50px sans-serif";
                ctx.textAlign = "center";
                const alpha = Math.min(1, (currentTime - (totalDuration - outroDuration)) / 1000);
                ctx.globalAlpha = alpha;
                ctx.fillText("LuvMoment", width / 2, height / 2);
                ctx.globalAlpha = 1;
            }
            // C. 메인 슬라이드 구간
            else {
                const currentSlideIndex = metas.findIndex(m =>
                    currentTime >= m.startTimeInTimeline && currentTime < m.startTimeInTimeline + m.duration
                );

                if (currentSlideIndex !== -1) {
                    const currentMeta = metas[currentSlideIndex];
                    const timeInSlide = currentTime - currentMeta.startTimeInTimeline;
                    const progress = timeInSlide / currentMeta.duration;
                    const baseScale = 1 + progress * kenBurnsIntensity;
                    const source = currentMeta.img || currentMeta.video!;

                    // 영상 싱크
                    if (source instanceof HTMLVideoElement) {
                        await seekVideoFrame(source, (currentMeta.startTimeInVideo || 0) + (timeInSlide / 1000), signal);
                    }

                    // 전환 효과 계산
                    const transitionDuration = bpm > 120 ? 300 : 500;
                    const transitionProgress = getTransitionProgress(timeInSlide, transitionDuration);
                    const transitionParams = calculateTransitionParams(
                        currentMeta.transition,
                        width,
                        height,
                        transitionProgress
                    );

                    // 렌더링
                    ctx.save();

                    // Wipe 클리핑
                    if (transitionParams.needsClip) {
                        applyWipeTransition(ctx, width, height, transitionProgress);
                    }

                    // 변환 적용 (오프셋, 스케일, 투명도)
                    ctx.globalAlpha = transitionParams.alpha;
                    ctx.translate(transitionParams.offsetX, transitionParams.offsetY);
                    
                    const finalScale = baseScale * transitionParams.scale;

                    drawLayout(currentMeta.layout, {
                        ctx,
                        source,
                        width,
                        height,
                        scale: finalScale,
                        variant: currentMeta.layoutVariant,
                        blurredBg: currentMeta.blurredBg,
                        pairSource: currentMeta.pairAsset?.img
                    });

                    ctx.restore();

                    // Flash 오버레이
                    if (currentMeta.transition === "flash" && transitionProgress < 1) {
                        applyFlashTransition(ctx, width, height, transitionProgress);
                    }

                    // 분위기 효과
                    applyAtmosphere(ctx, width, height, theme, currentTime, themeCache);
                }
            }

            // 프레임 추가
            await videoSource.add(frameIndex / fps, 1 / fps);

            // 진행률 콜백
            if (onProgress && frameIndex % 10 === 0) {
                const p = (frameIndex / totalFrames) * 100;
                onProgress(Math.min(p, 99));
            }
        }

        // 12. 종료 및 출력
        console.log(`⏳ Finalizing video...`);
        await output.finalize();

        const buffer = target.buffer;
        if (!buffer) throw new Error('Video encoding failed: buffer is null');
        const blob = new Blob([buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);

        if (onProgress) onProgress(100);
        
        return { blob, url, duration: totalDuration };

    } catch (error) {
        if (output) await output.cancel().catch(() => undefined);
        throw error;
    } finally {
        await resources.releaseAll();
    }
}

// ============================================
// 유틸리티 함수
// ============================================

export function downloadVideo(blob: Blob, filename: string = "luvmoment") {
    const fullName = filename.endsWith(".mp4") ? filename : `${filename}.mp4`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fullName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export async function shareVideo(blob: Blob, title: string = "LuvMoment") {
    const file = new File([blob], "video.mp4", { type: "video/mp4" });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
            title,
            files: [file]
        });
    } else {
        downloadVideo(blob);
    }
}
