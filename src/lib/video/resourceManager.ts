/**
 * LuvMoment Resource Manager
 * 
 * 비디오 생성 과정에서 사용되는 리소스(Object URL, DOM 요소 등)를 추적하고
 * 작업 완료 또는 에러 발생 시 안전하게 해제합니다.
 */

export class ResourceManager {
    private objectUrls: Set<string> = new Set();
    private videoElements: Set<HTMLVideoElement> = new Set();
    private audioContexts: Set<AudioContext> = new Set();

    /**
     * Object URL을 등록합니다.
     */
    addUrl(url: string | undefined) {
        if (url) {
            this.objectUrls.add(url);
        }
    }

    /**
     * 비디오 엘리먼트를 등록합니다.
     */
    addVideo(video: HTMLVideoElement) {
        this.videoElements.add(video);
    }

    /**
     * 오디오 컨텍스트를 등록합니다.
     */
    addAudioContext(ctx: AudioContext) {
        this.audioContexts.add(ctx);
    }

    /**
     * 모든 리소스를 해제합니다.
     */
    async releaseAll() {
        // 1. Object URL 해제
        this.objectUrls.forEach(url => {
            try {
                URL.revokeObjectURL(url);
            } catch {
                console.warn('Failed to revoke object URL');
            }
        });
        this.objectUrls.clear();

        // 2. 비디오 엘리먼트 정리
        this.videoElements.forEach(video => {
            try {
                video.pause();
                video.removeAttribute('src');
                video.load();
                video.remove();
            } catch (e) {
                console.warn('Failed to release video element', e);
            }
        });
        this.videoElements.clear();

        // 3. 오디오 컨텍스트 종료
        for (const ctx of this.audioContexts) {
            try {
                if (ctx.state !== 'closed') {
                    await ctx.close();
                }
            } catch (e) {
                console.warn('Failed to close AudioContext', e);
            }
        }
        this.audioContexts.clear();
        
        console.log('🧹 Resources released');
    }
}
