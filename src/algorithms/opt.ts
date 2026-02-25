import type { Snapshot, OPTVariables } from '../types';
import { emptyFrame, cloneFrames } from './utils';

export function runOPT(sequence: number[], frameCount: number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let frames = Array.from({ length: frameCount }, (_, i) => emptyFrame(i));
  let arrivalCounter = 0;
  let faults = 0;
  let hits = 0;

  for (let step = 0; step < sequence.length; step++) {
    const page = sequence[step];
    const newFrames = cloneFrames(frames);
    const hitIndex = newFrames.findIndex(f => f.page === page);

    if (hitIndex !== -1) {
      hits++;
      newFrames[hitIndex].isHit = true;

      snapshots.push({
        step, page, frames: newFrames,
        isFault: false, replacedFrameIndex: null,
        variables: buildVars(newFrames, sequence, step),
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    } else {
      faults++;
      const emptySlot = newFrames.findIndex(f => f.page === null);
      let replaceIdx: number;

      if (emptySlot !== -1) {
        replaceIdx = emptySlot;
      } else {
        // Reemplazar la página cuyo próximo uso sea más lejano (o nunca usada).
        // Desempate: si varias páginas tienen el mismo nextUse (incluido Infinity),
        // se elige la que llegó primero a memoria — criterio FIFO.
        let farthest = -1;
        replaceIdx = 0;

        for (let i = 0; i < newFrames.length; i++) {
          const p = newFrames[i].page as number;
          const nextUse = sequence.indexOf(p, step + 1);
          const dist = nextUse === -1 ? Infinity : nextUse;

          if (dist > farthest) {
            farthest = dist;
            replaceIdx = i;
          } else if (dist === farthest) {
            // Empate: elegir el que llegó antes (FIFO)
            if (newFrames[i].arrivalOrder < newFrames[replaceIdx].arrivalOrder) {
              replaceIdx = i;
            }
          }
        }
      }

      newFrames[replaceIdx].page = page;
      newFrames[replaceIdx].isNew = true;
      newFrames[replaceIdx].isReplaced = emptySlot === -1;
      newFrames[replaceIdx].arrivalOrder = ++arrivalCounter;

      snapshots.push({
        step, page, frames: newFrames,
        isFault: true, replacedFrameIndex: replaceIdx,
        variables: buildVars(newFrames, sequence, step),
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    }

    frames = newFrames;
  }

  return snapshots;
}

function buildVars(
  frames: ReturnType<typeof cloneFrames>,
  sequence: number[],
  currentStep: number,
): OPTVariables {
  return {
    type: 'OPT',
    nextUse: frames.map(f => {
      if (f.page === null) return { page: null, nextAt: '—' };
      const idx = sequence.indexOf(f.page, currentStep + 1);
      return {
        page: f.page,
        nextAt: idx === -1 ? 'Nunca' : `Paso ${idx + 1}`,
      };
    }),
  };
}
