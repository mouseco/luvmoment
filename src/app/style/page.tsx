"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, Pause, Check, Clapperboard, Heart, Plane } from "lucide-react";
import { useAppStore, THEMES, BGM_TRACKS, ThemeType, IntroType } from "@/store/useAppStore";

export default function StylePage() {
    const {
        selectedTheme, setTheme,
        selectedIntro, setIntro,
        selectedBGM, setBGM,
        images
    } = useAppStore();
    const [playingBGM, setPlayingBGM] = useState<string | null>(null);
    const [audioError, setAudioError] = useState<string | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
            audioRef.current = null;
        }
    }, []);

    const handleThemeSelect = (theme: ThemeType) => {
        setTheme(theme);
    };

    const handleIntroSelect = (intro: IntroType) => {
        setIntro(intro);
    };

    const handleBGMSelect = async (bgmId: string) => {
        setBGM(bgmId);
        setAudioError(null);
        const previous = audioRef.current;
        if (previous) {
            previous.pause();
            previous.removeAttribute('src');
            previous.load();
            audioRef.current = null;
        }
        if (playingBGM === bgmId) {
            setPlayingBGM(null);
            return;
        }
        const track = BGM_TRACKS.find(item => item.id === bgmId);
        if (!track) return;
        const audio = new Audio(track.src);
        audioRef.current = audio;
        audio.onended = () => {
            if (audioRef.current === audio) setPlayingBGM(null);
        };
        try {
            await audio.play();
            if (audioRef.current === audio) setPlayingBGM(bgmId);
        } catch {
            if (audioRef.current === audio) {
                setPlayingBGM(null);
                setAudioError('음악을 재생하지 못했습니다. 다시 선택해주세요.');
            }
        }
    };

    return (
        <main className="min-h-dvh relative overflow-hidden">
            {/* 배경 */}
            <div className="fixed inset-0 -z-10">
                <div
                    className="absolute inset-0"
                    style={{ background: "var(--gradient-hero)" }}
                />
                <div
                    className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-30 blur-3xl"
                    style={{ background: "var(--color-primary-light)" }}
                />
            </div>

            <div className="mobile-container min-h-dvh flex flex-col py-6">
                {/* 헤더 */}
                <header className="flex items-center justify-between mb-6">
                    <Link
                        href="/upload"
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95"
                        style={{
                            background: "var(--gradient-warm)",
                            color: "white"
                        }}
                    >
                        <span className="text-lg">←</span>
                    </Link>
                    <span
                        className="text-lg font-semibold"
                        style={{ color: "var(--color-text)" }}
                    >
                        스타일 선택
                    </span>
                    <div className="w-10" /> {/* 균형 맞추기 */}
                </header>

                {/* 테마 선택 */}
                <section className="mb-8">
                    <h2
                        className="text-sm font-medium mb-2 ml-1"
                        style={{ color: "var(--color-text-soft)" }}
                    >
                        영상 분위기 (테마)
                    </h2>
                    <div className="grid grid-cols-3 gap-3 py-4">
                        {(Object.keys(THEMES) as ThemeType[]).map((themeKey) => {
                            const theme = THEMES[themeKey];
                            const isSelected = selectedTheme === themeKey;
                            return (
                                <button
                                    key={themeKey}
                                    onClick={() => handleThemeSelect(themeKey)}
                                    className={`
                                        w-full p-3 rounded-2xl transition-all duration-300 relative overflow-hidden flex flex-col items-center
                                        ${isSelected ? "scale-105 shadow-lg z-10" : "scale-100 hover:scale-[1.02]"}
                                    `}
                                    style={{
                                        background: isSelected
                                            ? `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`
                                            : "#FFFFFF",
                                        border: isSelected
                                            ? "none"
                                            : "1px solid rgba(0,0,0,0.08)",
                                        boxShadow: isSelected
                                            ? `0 8px 20px -4px ${theme.colors[0]}80`
                                            : "0 2px 8px rgba(0,0,0,0.03)"
                                    }}
                                >
                                    <div className="text-3xl mb-2">{theme.emoji}</div>
                                    <div
                                        className="text-xs font-bold whitespace-nowrap"
                                        style={{ color: isSelected ? "white" : "#333333" }}
                                    >
                                        {theme.name}
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 text-white opacity-80">
                                            <Check size={14} strokeWidth={3} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 인트로 스타일 선택 */}
                <section className="mb-8">
                    <h2
                        className="text-sm font-medium mb-2 ml-1"
                        style={{ color: "var(--color-text-soft)" }}
                    >
                        인트로 스타일
                    </h2>
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { id: 'cinematic', name: 'Cinematic', icon: <Clapperboard size={20} /> },
                            { id: 'romantic', name: 'Romantic', icon: <Heart size={20} /> },
                            { id: 'travel', name: 'Travel', icon: <Plane size={20} /> },
                        ].map((intro) => {
                            const isSelected = selectedIntro === intro.id;
                            const themeColor = THEMES[selectedTheme].colors[0];
                            return (
                                <button
                                    key={intro.id}
                                    onClick={() => handleIntroSelect(intro.id as IntroType)}
                                    className={`
                                        w-full p-4 rounded-2xl transition-all duration-300 flex flex-col items-center gap-2
                                        ${isSelected ? "ring-2 ring-offset-1" : "hover:bg-white/60"}
                                    `}
                                    style={{
                                        background: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                                        borderColor: isSelected ? themeColor : "transparent",
                                        boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                                    }}
                                >
                                    <div
                                        className="p-2 rounded-xl"
                                        style={{
                                            background: isSelected ? `${themeColor}20` : "transparent",
                                            color: isSelected ? themeColor : "#888888"
                                        }}
                                    >
                                        {intro.icon}
                                    </div>
                                    <div
                                        className="text-[10px] font-bold"
                                        style={{ color: isSelected ? "#333333" : "#888888" }}
                                    >
                                        {intro.name}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* BGM 선택 */}
                <section className="flex-1 overflow-y-auto pb-4 -mx-1 px-1">
                    <h2
                        className="text-sm font-medium mb-4 ml-1"
                        style={{ color: "var(--color-text-soft)" }}
                    >
                        배경음악
                    </h2>
                    {audioError && <p role="alert" className="mb-3 text-sm" style={{ color: 'var(--color-text)' }}>{audioError}</p>}
                    <div className="space-y-3">
                        {BGM_TRACKS.map((track) => {
                            const isSelected = selectedBGM === track.id;
                            const isPlaying = playingBGM === track.id;
                            const themeColor = THEMES[selectedTheme].colors[0];

                            return (
                                <button
                                    key={track.id}
                                    onClick={() => handleBGMSelect(track.id)}
                                    className={`
                                        w-full p-3 pr-5 rounded-2xl flex items-center gap-4 transition-all duration-300 group
                                        ${isSelected ? "ring-2 ring-offset-1" : "hover:bg-white/60"}
                                    `}
                                    style={{
                                        background: isSelected ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                                        borderColor: isSelected ? themeColor : "transparent",
                                        boxShadow: isSelected ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                                        "--theme-color": themeColor
                                    } as React.CSSProperties}
                                >
                                    {/* 재생 버튼 (원형 아이콘) */}
                                    <div
                                        className={`
                                            w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                                            ${isPlaying ? "scale-105" : "scale-100"}
                                        `}
                                        style={{
                                            background: isPlaying
                                                ? themeColor
                                                : isSelected ? `${themeColor}20` : "#FFFFFF",
                                            color: isPlaying
                                                ? "white"
                                                : isSelected ? themeColor : "#888888"
                                        }}
                                    >
                                        {isPlaying ? (
                                            <Pause size={20} fill="currentColor" className="ml-0.5" />
                                        ) : (
                                            <Play size={20} fill="currentColor" className="ml-1" />
                                        )}
                                    </div>

                                    {/* 트랙 정보 */}
                                    <div className="flex-1 text-left">
                                        <div
                                            className="font-bold text-base mb-0.5"
                                            style={{ color: "#2D2A26" }}
                                        >
                                            {track.name}
                                        </div>
                                        <div
                                            className="text-xs font-medium"
                                            style={{ color: "#888888" }}
                                        >
                                            {track.artist}
                                        </div>
                                    </div>

                                    {/* 체크 표시 또는 재생시간 등 */}
                                    <div
                                        className={`
                                            w-6 h-6 flex items-center justify-center rounded-full transition-all
                                            ${isSelected ? "opacity-100 scale-100" : "opacity-0 scale-75"}
                                        `}
                                        style={{ background: themeColor }}
                                    >
                                        <Check size={14} color="white" strokeWidth={3} />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 다음 버튼 */}
                <div className="pt-4 mt-auto">
                    <Link href={images.length >= 3 && selectedBGM ? "/preview" : "#"}>
                        <button
                            className="btn-primary w-full"
                            disabled={images.length < 3 || !selectedBGM}
                            style={{
                                opacity: images.length < 3 || !selectedBGM ? 0.5 : 1,
                                cursor: images.length < 3 || !selectedBGM ? "not-allowed" : "pointer",
                            }}
                        >
                            {!selectedBGM ? "BGM을 선택해주세요" : "영상 미리보기 →"}
                        </button>
                    </Link>
                </div>
            </div>
        </main>
    );
}
