import type { Snapshot, CLOCKVariables } from '../types';
import { emptyFrame, cloneFrames } from './utils';

export function runClock(sequence: number[], frameCount: number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let frames = Array.from({ length: frameCount }, (_, i) => emptyFrame(i));
  let pointer = 0;
  let faults = 0;
  let hits = 0;

  for (let step = 0; step < sequence.length; step++) {
    const page = sequence[step];
    const newFrames = cloneFrames(frames);
    const hitIndex = newFrames.findIndex(f => f.page === page);

    if (hitIndex !== -1) {
      hits++;
      newFrames[hitIndex].isHit = true;
      newFrames[hitIndex].clockBit = true; // segunda oportunidad

      snapshots.push({
        step, page, frames: newFrames,
        isFault: false, replacedFrameIndex: null,
        clockPointer: pointer,
        variables: buildVars(newFrames, pointer, 0),
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    } else {
      faults++;
      const emptySlot = newFrames.findIndex(f => f.page === null);
      let replaceIdx: number;
      let steps = 0;

      if (emptySlot !== -1) {
        replaceIdx = emptySlot;
        pointer = (emptySlot + 1) % frameCount;
      } else {
        // Girar el reloj hasta encontrar clockBit=0
        while (newFrames[pointer].clockBit) {
          newFrames[pointer].clockBit = false; // dar segunda oportunidad
          pointer = (pointer + 1) % frameCount;
          steps++;
        }
        replaceIdx = pointer;
        pointer = (pointer + 1) % frameCount;
      }

      newFrames[replaceIdx].page = page;
      newFrames[replaceIdx].isNew = true;
      newFrames[replaceIdx].isReplaced = emptySlot === -1;
      newFrames[replaceIdx].clockBit = true;

      snapshots.push({
        step, page, frames: newFrames,
        isFault: true, replacedFrameIndex: replaceIdx,
        clockPointer: pointer,
        variables: buildVars(newFrames, pointer, steps),
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    }

    frames = newFrames;
  }

  return snapshots;
}

function buildVars(
  frames: ReturnType<typeof cloneFrames>,
  pointer: number,
  stepsToReplace: number,
): CLOCKVariables {
  return {
    type: 'CLOCK',
    pointer,
    frames: frames.map(f => ({ page: f.page, secondChanceBit: f.clockBit })),
    stepsToReplace,
  };
}
