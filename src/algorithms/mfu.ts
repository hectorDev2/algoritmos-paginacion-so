import type { Snapshot, MFUVariables } from '../types';
import { emptyFrame, cloneFrames } from './utils';

export function runMFU(sequence: number[], frameCount: number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let frames = Array.from({ length: frameCount }, (_, i) => emptyFrame(i));
  let timer = 0; // para desempate por LRU
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
      newFrames[hitIndex].frequency++;
      newFrames[hitIndex].lastUsed = timer;

      snapshots.push({
        step, page, frames: newFrames,
        isFault: false, replacedFrameIndex: null,
        variables: buildVars(newFrames),
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    } else {
      faults++;
      const emptySlot = newFrames.findIndex(f => f.page === null);
      let replaceIdx: number;

      if (emptySlot !== -1) {
        replaceIdx = emptySlot;
      } else {
        // Reemplazar la de MAYOR frecuencia; si empatan, la menos recientemente usada (LRU)
        replaceIdx = newFrames.reduce((maxIdx, f, i) => {
          const maxF = newFrames[maxIdx];
          if (f.frequency > maxF.frequency) return i;
          if (f.frequency === maxF.frequency && f.lastUsed < maxF.lastUsed) return i;
          return maxIdx;
        }, 0);
      }

      newFrames[replaceIdx].page = page;
      newFrames[replaceIdx].isNew = true;
      newFrames[replaceIdx].isReplaced = emptySlot === -1;
      newFrames[replaceIdx].frequency = 1;
      newFrames[replaceIdx].lastUsed = timer;

      snapshots.push({
        step, page, frames: newFrames,
        isFault: true, replacedFrameIndex: replaceIdx,
        variables: buildVars(newFrames),
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    }

    frames = newFrames;
  }

  return snapshots;
}

function buildVars(frames: ReturnType<typeof cloneFrames>): MFUVariables {
  return {
    type: 'MFU',
    frequencies: frames.map(f => ({ page: f.page, freq: f.frequency })),
  };
}
