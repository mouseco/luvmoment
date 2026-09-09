import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LuvMoment | 사진으로 만드는 감동 영상",
  description:
    "사진과 영상에 음악을 더해 기념일과 여행의 추억을 MP4로 만들어보세요. 가입 없이 무료로 시작합니다.",
  keywords: ["커플 영상", "기념일", "프로포즈", "추억 영상", "사진 영상"],
  authors: [{ name: "LuvMoment" }],
  openGraph: {
    title: "LuvMoment | 사진으로 만드는 감동 영상",
    description: "소중한 순간을 담은 사진들, 감동적인 기념일 영상으로 만들어 드려요.",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF6B6B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased grain-overlay">
        {children}
      </body>
    </html>
  );
}
