import type { Snapshot, LRUVariables } from '../types';
import { emptyFrame, cloneFrames } from './utils';

export function runLRU(sequence: number[], frameCount: number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let frames = Array.from({ length: frameCount }, (_, i) => emptyFrame(i));
  let timer = 0;
  let faults = 0;
  let hits = 0;

  for (let step = 0; step < sequence.length; step++) {
    const page = sequence[step];
    const newFrames = cloneFrames(frames);
    timer++;

    const hitIndex = newFrames.findIndex(f => f.page === page);

    if (hitIndex !== -1) {
      hits++;
      newFrames[hitIndex].isHit = true;
      newFrames[hitIndex].lastUsed = timer;

      snapshots.push({
        step,
        page,
        frames: newFrames,
        isFault: false,
        replacedFrameIndex: null,
        variables: buildVars(newFrames),
        cumulativeFaults: faults,
        cumulativeHits: hits,
      });
    } else {
      faults++;
      const emptySlot = newFrames.findIndex(f => f.page === null);
      let replaceIdx: number;

      if (emptySlot !== -1) {
        replaceIdx = emptySlot;
      } else {
        // Reemplazar el menos recientemente usado
        replaceIdx = newFrames.reduce((minIdx, f, i) =>
          f.lastUsed < newFrames[minIdx].lastUsed ? i : minIdx, 0);
      }

      newFrames[replaceIdx].page = page;
      newFrames[replaceIdx].isNew = true;
      newFrames[replaceIdx].isReplaced = emptySlot === -1;
      newFrames[replaceIdx].lastUsed = timer;

      snapshots.push({
        step,
        page,
        frames: newFrames,
        isFault: true,
        replacedFrameIndex: replaceIdx,
        variables: buildVars(newFrames),
        cumulativeFaults: faults,
        cumulativeHits: hits,
      });
    }

    frames = newFrames;
  }

  return snapshots;
}

function buildVars(frames: ReturnType<typeof cloneFrames>): LRUVariables {
  return {
    type: 'LRU',
    timestamps: frames.map(f => ({ page: f.page, lastUsed: f.lastUsed })),
  };
}
