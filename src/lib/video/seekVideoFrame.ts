/** Resolve only after the requested video frame can be drawn. */
export function seekVideoFrame(video: HTMLVideoElement, time: number, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    const target = Math.max(0, Math.min(time, Math.max(0, video.duration - 0.001)));
    if (!video.seeking && video.readyState >= 2 && Math.abs(video.currentTime - target) < 0.0001) return Promise.resolve();

    return new Promise((resolve, reject) => {
        const cleanup = () => {
            clearTimeout(timer);
            video.removeEventListener('seeked', onSeeked);
            video.removeEventListener('error', onError);
            signal?.removeEventListener('abort', onAbort);
        };
        const onSeeked = () => { cleanup(); resolve(); };
        const onError = () => { cleanup(); reject(new Error('영상 프레임을 읽지 못했습니다. 다른 파일을 선택해주세요.')); };
        const onAbort = () => { cleanup(); reject(signal?.reason); };
        const timer = setTimeout(onError, 10000);
        video.addEventListener('seeked', onSeeked, { once: true });
        video.addEventListener('error', onError, { once: true });
        signal?.addEventListener('abort', onAbort, { once: true });
        try { video.currentTime = target; } catch { onError(); }
    });
}
