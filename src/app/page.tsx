"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <main className="min-h-dvh relative overflow-hidden">
      {/* 배경 레이어 */}
      <div className="fixed inset-0 -z-10">
        {/* 메인 그라디언트 */}
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero)" }}
        />

        {/* 플로팅 오브 - 좌상단 */}
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-40 blur-3xl animate-float"
          style={{ background: "var(--color-primary-light)" }}
        />

        {/* 플로팅 오브 - 우하단 */}
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl animate-float"
          style={{
            background: "var(--color-accent)",
            animationDelay: "2s",
          }}
        />

        {/* 미묘한 패턴 */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--color-text) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* 콘텐츠 */}
      <div className="mobile-container min-h-dvh flex flex-col justify-between py-12">
        {/* 헤더 */}
        <header className="opacity-0 animate-fade-in-up">
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
              style={{ background: "var(--gradient-warm)" }}
            >
              ❤️
            </div>
            <span
              className="text-xl font-bold"
              style={{ color: "var(--color-primary)" }}
            >
              LuvMoment
            </span>
          </div>
        </header>

        {/* 히어로 섹션 */}
        <section className="flex-1 flex flex-col justify-center -mt-8">
          {/* 메인 카피 */}
          <div className="space-y-4 mb-10">
            <h1
              className="text-[2.5rem] leading-tight font-bold opacity-0 animate-fade-in-up animate-delay-100"
              style={{
                color: "white",
                textShadow: `
                  0 2px 4px rgba(0, 0, 0, 0.3),
                  0 4px 12px rgba(255, 107, 107, 0.4),
                  0 0 30px rgba(255, 107, 107, 0.3)
                `
              }}
            >
              사진만 올리면,
              <br />
              <span style={{
                color: "var(--color-primary)",
                textShadow: `
                  0 2px 4px rgba(0, 0, 0, 0.2),
                  0 4px 16px rgba(255, 107, 107, 0.5),
                  0 0 40px rgba(255, 107, 107, 0.4)
                `
              }}>감동 영상</span>이
              <br />
              완성됩니다
            </h1>
            <p
              className="text-lg opacity-0 animate-fade-in-up animate-delay-200"
              style={{
                color: "rgba(120, 110, 100, 0.9)",
                textShadow: "0 1px 2px rgba(255, 255, 255, 0.5)"
              }}
            >
              기념일, 프로포즈, 소중한 순간들.
              <br />
              사진을 고르면 편집은 자동으로.
            </p>
          </div>

          {/* 프리뷰 카드 */}
          <div
            className="glass-card p-6 mb-10 opacity-0 animate-fade-in-up animate-delay-300"
          >
            <div className="flex items-center gap-4 mb-4">
              {/* 썸네일 미리보기 */}
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-xl border-2 border-white shadow-sm flex items-center justify-center text-xl"
                    style={{
                      background: `hsl(${20 + i * 15}, 80%, ${85 - i * 5}%)`,
                    }}
                  >
                    {["📸", "💑", "🎂", "✨"][i - 1]}
                  </div>
                ))}
              </div>
              <div className="flex-1">
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text)" }}
                >
                  사진 4장으로
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  30초 영상 완성 예정
                </div>
              </div>
            </div>

            {/* 프로그레스 시뮬레이션 */}
            <div className="relative h-2 rounded-full overflow-hidden bg-white/50">
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{
                  width: "65%",
                  background: "var(--gradient-warm)",
                }}
              />
            </div>
          </div>

          {/* CTA 버튼 */}
          <div className="opacity-0 animate-fade-in-up animate-delay-400">
            <Link href="/upload">
              <button
                className="btn-primary w-full text-center"
                onMouseDown={() => setIsPressed(true)}
                onMouseUp={() => setIsPressed(false)}
                onMouseLeave={() => setIsPressed(false)}
                style={{
                  transform: isPressed ? "scale(0.98)" : "scale(1)",
                }}
              >
                📸 영상 만들기 시작
              </button>
            </Link>

            <p
              className="text-center text-sm mt-4"
              style={{ color: "var(--color-text-muted)" }}
            >
              무료로 만들기 · 가입 없이 시작
            </p>
          </div>
        </section>

        {/* 푸터 - 간단한 피처 */}
        <footer className="opacity-0 animate-fade-in-up animate-delay-500">
          <div className="flex justify-center gap-6 text-sm">
            {[
              { icon: "⚡", label: "자동 편집" },
              { icon: "🎨", label: "감성 템플릿" },
              { icon: "🎵", label: "자동 BGM" },
            ].map((feature) => (
              <div
                key={feature.label}
                className="flex items-center gap-1.5"
                style={{ color: "var(--color-text-soft)" }}
              >
                <span>{feature.icon}</span>
                <span>{feature.label}</span>
              </div>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}
