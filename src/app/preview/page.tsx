"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
    ChevronLeft, Play, Pause, SkipBack, SkipForward,
    Download, Share2, RotateCcw, Wand2, Loader2,
    Clock, Images, Type, ChevronDown
} from "lucide-react";
import { useAppStore, THEMES, BGM_TRACKS } from "@/store/useAppStore";
import { generateVideo, downloadVideo, shareVideo } from "@/lib/videoGenerator";

type GenerationStatus = "idle" | "generating" | "complete" | "error";

export default function PreviewPage() {
    const {
        images, selectedTheme, selectedIntro, selectedBGM,
        introTitle, introSubtitle, setIntroTitle, setIntroSubtitle
    } = useAppStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    // 영상 생성 상태
    const [generationStatus, setGenerationStatus] = useState<GenerationStatus>("idle");
    const [generationProgress, setGenerationProgress] = useState(0);
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
    const [showIntroSettings, setShowIntroSettings] = useState(false);
    const [audioMetadata, setAudioMetadata] = useState<{ src: string; duration: number } | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const mounted = useRef(true);
    const generationController = useRef<AbortController | null>(null);

    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            generationController.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (generatedVideoUrl) return () => URL.revokeObjectURL(generatedVideoUrl);
    }, [generatedVideoUrl]);

    const theme = THEMES[selectedTheme];

    // BGM 정보
    const selectedTrack = BGM_TRACKS.find(t => t.id === selectedBGM);

    // 🆕 오디오 파일 로드 시 duration 자동 추출
    useEffect(() => {
        if (!selectedTrack?.src) return;

        const audio = new Audio(selectedTrack.src);
        const handleMetadata = () => {
            if (Number.isFinite(audio.duration)) setAudioMetadata({ src: selectedTrack.src, duration: audio.duration });
        };
        audio.addEventListener('loadedmetadata', handleMetadata);

        return () => {
            audio.removeEventListener('loadedmetadata', handleMetadata);
            audio.src = '';
        };
    }, [selectedTrack]);

    // 실제 duration 사용 (자동 추출 우선, 없으면 정적 값, 그것도 없으면 기본값)
    const effectiveDuration = (audioMetadata?.src === selectedTrack?.src ? audioMetadata?.duration : undefined) ?? selectedTrack?.duration ?? 60;

    // 슬라이드 시간 계산
    const slideDuration = images.length > 0
        ? (effectiveDuration * 1000) / images.length
        : 3000;

    // 예상 영상 길이
    const estimatedDuration = Math.ceil(effectiveDuration);

    // 슬라이드쇼 재생
    useEffect(() => {
        if (!isPlaying || images.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, slideDuration);

        return () => clearInterval(interval);
    }, [isPlaying, images.length, slideDuration]);

    // 영상 생성
    const handleGenerateVideo = useCallback(async () => {
        if (images.length === 0) return;

        setGenerationStatus("generating");
        setGenerationError(null);
        setGenerationProgress(0);
        setIsPlaying(false);

        const selectedTrack = BGM_TRACKS.find(t => t.id === selectedBGM);
        generationController.current?.abort();
        const controller = new AbortController();
        generationController.current = controller;

        try {
            const result = await generateVideo({
                signal: controller.signal,
                assets: images.map((img) => ({
                    id: img.id,
                    type: img.type,
                    url: img.type === 'video' ? (img.videoUrl || "") : img.preview,
                    startTime: img.startTime
                })),
                audioUrl: selectedTrack?.src,
                width: 1080,
                height: 1920,
                fps: 30,
                theme: selectedTheme,
                introType: selectedIntro,
                onProgress: (p) => { if (mounted.current) setGenerationProgress(p); },
                enableIntro: true,
                enableOutro: true,
                // 🆕 커스텀 인트로 텍스트 전달
                introTitle: introTitle || undefined,
                introSubtitle: introSubtitle || undefined,
            });

            if (!mounted.current) {
                URL.revokeObjectURL(result.url);
                return;
            }
            setGeneratedVideoUrl(result.url);
            setGeneratedBlob(result.blob);
            setGenerationStatus("complete");
        } catch (error) {
            if (controller.signal.aborted) return;
            console.error("영상 생성 실패:", error);
            if (mounted.current) {
                setGenerationError(error instanceof Error ? error.message : '영상을 만들지 못했습니다. 다시 시도해주세요.');
                setGenerationStatus("error");
            }
        }
    }, [images, selectedTheme, selectedIntro, selectedBGM, introTitle, introSubtitle]);

    // 다운로드
    const handleDownload = useCallback(() => {
        if (generatedBlob) {
            downloadVideo(generatedBlob, `luvmoment_${Date.now()}`);
        }
    }, [generatedBlob]);

    // 공유
    const handleShare = useCallback(async () => {
        if (generatedBlob) {
            try {
                await shareVideo(generatedBlob);
            } catch (error) {
                if (!(error instanceof DOMException && error.name === 'AbortError')) handleDownload();
            }
        }
    }, [generatedBlob, handleDownload]);

    if (images.length === 0) {
        return (
            <main className="min-h-dvh flex items-center justify-center" style={{ background: "var(--gradient-hero)" }}>
                <div className="text-center">
                    <p className="text-xl mb-4" style={{ color: "var(--color-text)" }}>
                        먼저 사진을 선택해주세요
                    </p>
                    <Link href="/upload">
                        <button className="btn-primary">사진 선택하기</button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-dvh relative overflow-hidden bg-black">
            <div
                className="fixed inset-0 -z-10 opacity-30 blur-3xl"
                style={{
                    background: `radial-gradient(circle at center, ${theme.colors[0]}, ${theme.colors[2]} 80%)`,
                }}
            />

            <div className="mobile-container min-h-dvh flex flex-col py-6">
                <header className="flex items-center justify-between mb-4">
                    <Link
                        href="/style"
                        aria-label="스타일 선택으로 돌아가기"
                        className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 backdrop-blur-md active:scale-95 transition-transform"
                    >
                        <ChevronLeft className="text-white" />
                    </Link>
                    <span className="text-lg font-semibold text-white">미리보기</span>
                    <div className="w-10" />
                </header>

                <div className="flex-1 flex flex-col items-center justify-center relative">
                    {generationStatus !== "complete" && generationStatus !== "generating" && (
                        <div className="flex gap-2 mb-6">
                            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md flex items-center gap-1.5 text-xs text-white/90">
                                <Images size={12} />
                                <span>{images.length}장</span>
                            </div>
                            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md flex items-center gap-1.5 text-xs text-white/90">
                                <Clock size={12} />
                                <span>약 {estimatedDuration}초</span>
                            </div>
                        </div>
                    )}

                    <div
                        className="relative w-full max-w-[280px] aspect-[9/16] rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-white/10"
                        style={{
                            background: "#1a1a1a",
                            boxShadow: `0 20px 60px -10px ${theme.colors[0]}50`,
                        }}
                    >
                        {generationStatus === "complete" && generatedVideoUrl ? (
                            <video
                                src={generatedVideoUrl}
                                controls
                                autoPlay
                                loop
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <>
                                <img
                                    src={images[currentIndex]?.preview}
                                    alt=""
                                    className="w-full h-full object-cover transition-opacity duration-500"
                                />
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: `linear-gradient(to bottom, transparent 70%, ${theme.colors[0]}66 100%)`,
                                    }}
                                />
                                <div className="absolute bottom-5 left-0 right-0 px-6 flex items-center justify-between text-white">
                                    <span className="font-medium text-sm tracking-widest opacity-90 drop-shadow-md">LuvMoment</span>
                                    <span className="text-2xl drop-shadow-md">{theme.emoji}</span>
                                </div>

                                {generationStatus === "generating" && (
                                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                                        <div className="relative mb-6">
                                            <div
                                                className="w-16 h-16 rounded-full animate-spin border-4 border-t-transparent"
                                                style={{ borderColor: `${theme.colors[0]}40`, borderTopColor: theme.colors[0] }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                                                {Math.round(generationProgress)}%
                                            </div>
                                        </div>
                                        <h3 className="text-white text-lg font-bold mb-2">영상 만드는 중...</h3>
                                        <p className="text-white/90 text-sm text-center px-6 leading-relaxed">
                                            완료될 때까지 이 탭을 열어두세요.<br />
                                            탭을 닫거나 새로고침하면<br />
                                            영상 생성이 중단됩니다.
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {generationStatus === "idle" && (
                        <div className="mt-8 flex items-center gap-8">
                            <button
                                aria-label="이전 사진"
                                onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
                                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
                            >
                                <SkipBack size={20} fill="currentColor" />
                            </button>
                            <button
                                aria-label={isPlaying ? '미리보기 일시정지' : '미리보기 재생'}
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                                style={{
                                    background: theme.colors[0],
                                    boxShadow: `0 8px 24px ${theme.colors[0]}60`
                                }}
                            >
                                {isPlaying ? (
                                    <Pause size={28} fill="currentColor" className="ml-0.5" />
                                ) : (
                                    <Play size={28} fill="currentColor" className="ml-1" />
                                )}
                            </button>
                            <button
                                aria-label="다음 사진"
                                onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
                                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all"
                            >
                                <SkipForward size={20} fill="currentColor" />
                            </button>
                        </div>
                    )}
                </div>

                {/* 🆕 인트로 텍스트 커스터마이징 섹션 */}
                {generationStatus === "idle" && (
                    <div className="mt-6 w-full max-w-[320px]">
                        <button
                            onClick={() => setShowIntroSettings(!showIntroSettings)}
                            className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white/10 backdrop-blur-md text-white/80 text-sm hover:bg-white/15 transition-all"
                        >
                            <div className="flex items-center gap-2">
                                <Type size={16} />
                                <span>인트로 텍스트 설정</span>
                                {(introTitle || introSubtitle) && (
                                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                )}
                            </div>
                            <ChevronDown
                                size={16}
                                className={`transition-transform ${showIntroSettings ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {showIntroSettings && (
                            <div className="mt-3 p-4 rounded-xl bg-white/10 backdrop-blur-md space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-white/60 text-xs mb-2">메인 타이틀</label>
                                    <input
                                        type="text"
                                        value={introTitle}
                                        onChange={(e) => setIntroTitle(e.target.value)}
                                        placeholder="Our Story"
                                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors"
                                        maxLength={30}
                                    />
                                </div>
                                <div>
                                    <label className="block text-white/60 text-xs mb-2">서브 타이틀</label>
                                    <input
                                        type="text"
                                        value={introSubtitle}
                                        onChange={(e) => setIntroSubtitle(e.target.value)}
                                        placeholder="Special Moments"
                                        className="w-full px-4 py-3 rounded-xl bg-black/30 border border-white/20 text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 transition-colors"
                                        maxLength={50}
                                    />
                                </div>
                                <p className="text-white/40 text-xs">
                                    비워두면 기본 텍스트가 사용됩니다
                                </p>
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-6 space-y-3 pb-4">
                    {generationError && <p role="alert" className="text-sm text-white text-center">{generationError}</p>}
                    {generationStatus === "complete" ? (
                        <div className="space-y-3 animate-fade-in-up">
                            <button
                                className="btn-primary w-full flex items-center justify-center gap-2"
                                onClick={handleDownload}
                            >
                                <Download size={20} />
                                <span>영상 저장하기</span>
                            </button>
                            <button
                                className="w-full py-4 rounded-2xl font-bold text-white transition-all flex items-center justify-center gap-2 active:scale-98"
                                style={{ background: "rgba(255,255,255,0.2)" }}
                                onClick={handleShare}
                            >
                                <Share2 size={20} />
                                <span>공유하기</span>
                            </button>
                            <button
                                className="w-full py-2 text-sm text-white/50 hover:text-white transition-colors flex items-center justify-center gap-1.5"
                                onClick={() => {
                                    setGenerationStatus("idle");
                                    setGeneratedVideoUrl(null);
                                    setGeneratedBlob(null);
                                }}
                            >
                                <RotateCcw size={14} />
                                <span>다시 만들기</span>
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <button
                                className="btn-primary w-full flex items-center justify-center gap-2"
                                onClick={handleGenerateVideo}
                                disabled={generationStatus === "generating"}
                                style={{ opacity: generationStatus === "generating" ? 0.5 : 1 }}
                            >
                                {generationStatus === "generating" ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>생성 중...</span>
                                    </>
                                ) : (
                                    <>
                                        <Wand2 size={20} />
                                        <span>영상 만들기 시작</span>
                                    </>
                                )}
                            </button>
                            <Link href="/style" className="block text-center">
                                <button
                                    className="text-sm text-white/50 hover:text-white transition-colors py-2"
                                    disabled={generationStatus === "generating"}
                                >
                                    스타일 다시 선택
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
