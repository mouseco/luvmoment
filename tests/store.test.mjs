import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { useAppStore } from '../src/store/useAppStore.ts';

function asset(id, video = false) {
    const file = new File(['fixture'], 'sample.png', { type: 'image/png' });
    return { id, file, preview: URL.createObjectURL(file), type: video ? 'video' : 'image',
        ...(video ? { videoUrl: URL.createObjectURL(file) } : {}) };
}

afterEach(() => useAppStore.getState().reset());

test('removing a video releases both its thumbnail and original file URL', async () => {
    const video = asset('video', true);
    useAppStore.getState().addImages([video]);
    useAppStore.getState().removeImage(video.id);
    assert.equal(useAppStore.getState().images.length, 0);
    await assert.rejects(fetch(video.preview));
    await assert.rejects(fetch(video.videoUrl));
});

test('reset releases video file URLs as well as images', async () => {
    const video = asset('video', true);
    useAppStore.getState().addImages([video]);
    useAppStore.getState().reset();
    await assert.rejects(fetch(video.videoUrl));
});

test('assets above the selection limit do not leave live object URLs', async () => {
    const assets = Array.from({ length: 31 }, (_, index) => asset(String(index)));
    useAppStore.getState().addImages(assets);
    assert.equal(useAppStore.getState().images.length, 30);
    await assert.rejects(fetch(assets[30].preview));
});

test('reordering preserves all assets and ignores invalid indexes', () => {
    const assets = [asset('a'), asset('b'), asset('c')];
    useAppStore.getState().addImages(assets);
    useAppStore.getState().reorderImages(0, 2);
    assert.deepEqual(useAppStore.getState().images.map(item => item.id), ['b', 'c', 'a']);
    useAppStore.getState().reorderImages(-1, 0);
    assert.deepEqual(useAppStore.getState().images.map(item => item.id), ['b', 'c', 'a']);
});
