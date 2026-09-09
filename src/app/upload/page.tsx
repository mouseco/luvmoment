"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useAppStore, SelectedAsset } from "@/store/useAppStore";
import { Video, X } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    TouchSensor,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * 개별 에셋 아이템 (정렬 가능)
 */
function SortableAssetItem({ 
    image, 
    index, 
    removeImage 
}: { 
    image: SelectedAsset; 
    index: number; 
    removeImage: (id: string) => void 
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: image.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative rounded-xl overflow-hidden group cursor-grab active:cursor-grabbing transition-all bg-black/5 ${isDragging ? 'scale-95 shadow-2xl opacity-50' : ''}`}
        >
            {/* 드래그 핸들 전용 영역 (터치 인식 개선) */}
            <div {...attributes} {...listeners} className="absolute inset-0 z-10" />

            {/* 블러 배경 */}
            <img
                src={image.preview}
                alt=""
                className="absolute inset-0 w-full h-full object-cover blur-md opacity-30 scale-110"
            />
            
            {/* 실제 미리보기 */}
            <img
                src={image.preview}
                alt={`선택된 에셋 ${index + 1}`}
                className="relative w-full h-full object-contain pointer-events-none z-10"
            />

            {/* 순서 표시 */}
            <div
                className="absolute top-2 left-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white z-20 pointer-events-none"
                style={{ background: "var(--color-primary)" }}
            >
                {index + 1}
            </div>

            {/* 영상 뱃지 */}
            {image.type === 'video' && (
                <div className="absolute top-2 right-8 w-6 h-6 rounded-full flex items-center justify-center bg-black/60 text-white z-20 pointer-events-none">
                    <Video size={12} />
                </div>
            )}

            {/* 삭제 버튼 */}
            <button
                aria-label={`에셋 ${index + 1} 삭제`}
                onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm md:opacity-0 group-hover:opacity-100 transition-opacity z-30"
                style={{ background: "rgba(0,0,0,0.5)" }}
            >
                <X size={14} />
            </button>
        </div>
    );
}

/**
 * 영상의 픽셀 변화량을 분석하여 가장 역동적인 3초 구간의 시작 지점을 찾습니다.
 */
const analyzeVideoHighlight = (file: File): Promise<{ startTime: number; thumbnail: string }> => {
    return new Promise((resolve) => {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.muted = true;
        video.playsInline = true;

        const videoUrl = URL.createObjectURL(file);
        video.src = videoUrl;

        video.onloadedmetadata = async () => {
            const duration = video.duration;
            const sampleInterval = 0.5; // 0.5초 간격으로 샘플링
            const scores: { time: number; score: number }[] = [];
            
            const canvas = document.createElement("canvas");
            const analyzeWidth = 160; 
            const analyzeHeight = Math.round(analyzeWidth * (video.videoHeight / video.videoWidth));
            canvas.width = analyzeWidth;
            canvas.height = analyzeHeight;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });

            let lastImageData: Uint8ClampedArray | null = null;
            let bestThumbnail = "";
            let maxSingleScore = -1;

            for (let t = 0; t < duration; t += sampleInterval) {
                video.currentTime = t;
                await new Promise((r) => (video.onseeked = r));
                ctx?.drawImage(video, 0, 0, analyzeWidth, analyzeHeight);
                const currentImageData = ctx?.getImageData(0, 0, analyzeWidth, analyzeHeight).data;
                if (currentImageData && lastImageData) {
                    let diff = 0;
                    for (let i = 0; i < currentImageData.length; i += 4 * 4) {
                        diff += Math.abs(currentImageData[i] - lastImageData[i]);
                    }
                    scores.push({ time: t, score: diff });
                    if (diff > maxSingleScore) {
                        maxSingleScore = diff;
                        bestThumbnail = canvas.toDataURL("image/jpeg", 0.8);
                    }
                }
                lastImageData = currentImageData || null;
            }

            const windowSize = Math.floor(3 / sampleInterval);
            let maxWindowScore = -1;
            let bestStartTime = 0;
            for (let i = 0; i <= scores.length - windowSize; i++) {
                let windowSum = 0;
                for (let j = 0; j < windowSize; j++) {
                    windowSum += scores[i + j].score;
                }
                if (windowSum > maxWindowScore) {
                    maxWindowScore = windowSum;
                    bestStartTime = scores[i].time;
                }
            }
            URL.revokeObjectURL(videoUrl);
            resolve({ startTime: bestStartTime, thumbnail: bestThumbnail });
        };

        video.onerror = () => {
            URL.revokeObjectURL(videoUrl);
            resolve({ startTime: 0, thumbnail: "" });
        };
    });
};

export default function UploadPage() {
    const { images, addImages, removeImage, reorderImages } = useAppStore();
    const [isProcessing, setIsProcessing] = useState(false);

    // 모바일 터치 및 마우스 센서 설정
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200, // 0.2초 롱프레스 시 드래그 시작
                tolerance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleFileSelect = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files) return;
            setIsProcessing(true);
            const newAssets: SelectedAsset[] = [];
            for (const file of Array.from(files)) {
                const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                if (file.type.startsWith("image/")) {
                    newAssets.push({ id, file, preview: URL.createObjectURL(file), type: 'image' });
                } else if (file.type.startsWith("video/")) {
                    const { startTime, thumbnail } = await analyzeVideoHighlight(file);
                    newAssets.push({ id, file, preview: thumbnail || "", type: 'video', videoUrl: URL.createObjectURL(file), startTime });
                }
            }
            addImages(newAssets);
            setIsProcessing(false);
            e.target.value = "";
        },
        [addImages]
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = images.findIndex((img) => img.id === active.id);
            const newIndex = images.findIndex((img) => img.id === over.id);
            reorderImages(oldIndex, newIndex);
        }
    };

    return (
        <main className="min-h-dvh relative overflow-hidden">
            <div className="fixed inset-0 -z-10">
                <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-30 blur-3xl" style={{ background: "var(--color-primary-light)" }} />
            </div>

            <div className="mobile-container min-h-dvh flex flex-col py-6">
                <header className="flex items-center justify-between mb-6">
                    <Link href="/" className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform active:scale-95" style={{ background: "var(--gradient-warm)", color: "white" }}>
                        <span className="text-lg">←</span>
                    </Link>
                    <span className="text-lg font-semibold" style={{ color: "var(--color-text)" }}>사진/영상 선택</span>
                    <span className="text-sm font-medium px-3 py-1 rounded-full" style={{ background: images.length > 0 ? "var(--color-primary)" : "rgba(0,0,0,0.1)", color: images.length > 0 ? "white" : "var(--color-text-muted)" }}>
                        {images.length}/30
                    </span>
                </header>

                <div className="flex-1 flex flex-col">
                    {images.length === 0 ? (
                        <label className="flex-1 flex flex-col items-center justify-center glass-card cursor-pointer transition-all duration-300 hover:scale-[1.01]">
                            <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6" style={{ background: "var(--color-accent-soft)" }}>
                                {isProcessing ? "⏳" : "📸"}
                            </div>
                            <p className="text-xl font-semibold mb-2" style={{ color: "var(--color-text)" }}>{isProcessing ? "분석 중..." : "사진이나 영상을 선택해주세요"}</p>
                            <p className="text-sm text-center" style={{ color: "var(--color-text-muted)" }}>갤러리에서 최대 30장까지<br />선택할 수 있어요</p>
                        </label>
                    ) : (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            <div className="flex-1 overflow-y-auto pb-4">
                                <DndContext 
                                    sensors={sensors} 
                                    collisionDetection={closestCenter} 
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext 
                                        items={images.map(img => img.id)} 
                                        strategy={rectSortingStrategy}
                                    >
                                        <div className="grid grid-cols-3 gap-2">
                                            {images.map((image, index) => (
                                                <SortableAssetItem 
                                                    key={image.id} 
                                                    image={image} 
                                                    index={index} 
                                                    removeImage={removeImage} 
                                                />
                                            ))}

                                            {images.length < 30 && (
                                                <label className="aspect-square rounded-xl flex items-center justify-center cursor-pointer transition-all hover:scale-95" style={{ background: "rgba(255,255,255,0.5)", border: "2px dashed var(--color-text-muted)" }}>
                                                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                                                    <span className="text-2xl" style={{ color: "var(--color-text-muted)" }}>
                                                        {isProcessing ? <LoaderCircle className="animate-spin" /> : "+"}
                                                    </span>
                                                </label>
                                            )}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            </div>
                            <div className="py-3 px-1 text-center">
                                <p className="text-xs text-black/40">길게 눌러서 순서를 바꿀 수 있어요</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="pt-4">
                    <p className="text-xs text-center mb-3" style={{ color: 'var(--color-text-soft)' }}>
                        사진과 영상은 서버에 업로드되지 않습니다.<br />새로고침하거나 창을 닫으면 선택 내용이 초기화됩니다.
                    </p>
                    <Link href={images.length >= 3 ? "/style" : "#"}>
                        <button className="btn-primary w-full" disabled={images.length < 3 || isProcessing} style={{ opacity: images.length < 3 || isProcessing ? 0.5 : 1, cursor: images.length < 3 || isProcessing ? "not-allowed" : "pointer" }}>
                            {isProcessing ? "분석 중..." : images.length < 3 ? `${3 - images.length}개 더 선택해주세요` : "다음 단계 →"}
                        </button>
                    </Link>
                </div>
            </div>
        </main>
    );
}

function LoaderCircle({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    );
}

