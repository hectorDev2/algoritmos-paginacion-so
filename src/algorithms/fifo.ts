import type { Snapshot, FIFOVariables } from '../types';
import { emptyFrame, cloneFrames } from './utils';

export function runFIFO(sequence: number[], frameCount: number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let frames = Array.from({ length: frameCount }, (_, i) => emptyFrame(i));
  let fifoPointer = 0;
  let arrivalCounter = 0;
  let faults = 0;
  let hits = 0;

  for (let step = 0; step < sequence.length; step++) {
    const page = sequence[step];
    const newFrames = cloneFrames(frames);

    const hitIndex = newFrames.findIndex(f => f.page === page);

    if (hitIndex !== -1) {
      // HIT
      hits++;
      newFrames[hitIndex].isHit = true;

      const vars: FIFOVariables = {
        type: 'FIFO',
        pointer: fifoPointer,
        queue: newFrames
          .filter(f => f.page !== null)
          .sort((a, b) => a.arrivalOrder - b.arrivalOrder)
          .map(f => f.page as number),
      };

      snapshots.push({
        step,
        page,
        frames: newFrames,
        isFault: false,
        replacedFrameIndex: null,
        fifoPointer,
        variables: vars,
        cumulativeFaults: faults,
        cumulativeHits: hits,
      });
    } else {
      // FAULT
      faults++;
      const emptySlot = newFrames.findIndex(f => f.page === null);
      let replaceIdx: number;

      if (emptySlot !== -1) {
        replaceIdx = emptySlot;
      } else {
        replaceIdx = fifoPointer;
        fifoPointer = (fifoPointer + 1) % frameCount;
      }

      newFrames[replaceIdx].page = page;
      newFrames[replaceIdx].isNew = true;
      newFrames[replaceIdx].isReplaced = emptySlot === -1;
      newFrames[replaceIdx].arrivalOrder = ++arrivalCounter;

      const vars: FIFOVariables = {
        type: 'FIFO',
        pointer: fifoPointer,
        queue: newFrames
          .filter(f => f.page !== null)
          .sort((a, b) => a.arrivalOrder - b.arrivalOrder)
          .map(f => f.page as number),
      };

      snapshots.push({
        step,
        page,
        frames: newFrames,
        isFault: true,
        replacedFrameIndex: replaceIdx,
        fifoPointer,
        variables: vars,
        cumulativeFaults: faults,
        cumulativeHits: hits,
      });
    }

    frames = newFrames;
  }

  return snapshots;
}
