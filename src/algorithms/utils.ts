import type { FrameState } from '../types';

export function emptyFrame(frameIndex: number): FrameState {
  return {
    frameIndex,
    page: null,
    isNew: false,
    isReplaced: false,
    isHit: false,
    bitR: false,
    bitM: false,
    clockBit: false,
    lastUsed: 0,
    frequency: 0,
    arrivalOrder: 0,
  };
}

export function cloneFrames(frames: FrameState[]): FrameState[] {
  return frames.map(f => ({ ...f, isNew: false, isReplaced: false, isHit: false }));
}
