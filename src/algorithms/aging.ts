import type { Snapshot, AgingVariables } from '../types';
import { emptyFrame, cloneFrames } from './utils';

// Aging (envejecimiento):
//   - Al acceder a una página (hit o carga nueva) su contador se pone a 1.
//   - En cada paso, todos los demás frames incrementan su contador en 1.
//   - Al producirse un fallo se reemplaza el frame con el contador MÁS ALTO
//     (el que lleva más pasos sin ser usado).
// Desempate: mayor contador → menor lastUsed (LRU) si empatan.

export function runAging(sequence: number[], frameCount: number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let frames = Array.from({ length: frameCount }, (_, i) => emptyFrame(i));
  let timer = 0;
  let faults = 0;
  let hits = 0;

  for (let step = 0; step < sequence.length; step++) {
    const page = sequence[step];
    let newFrames = cloneFrames(frames);
    timer++;

    // Envejecer todos los frames ocupados (+1 cada paso)
    newFrames = newFrames.map(f => ({
      ...f,
      agingCounter: f.page !== null ? f.agingCounter + 1 : 0,
    }));

    const hitIndex = newFrames.findIndex(f => f.page === page);

    if (hitIndex !== -1) {
      // HIT: se usó ahora → resetear a 1
      hits++;
      newFrames[hitIndex].isHit = true;
      newFrames[hitIndex].agingCounter = 1;
      newFrames[hitIndex].lastUsed = timer;

      snapshots.push({
        step, page, frames: newFrames,
        isFault: false, replacedFrameIndex: null,
        variables: buildVars(newFrames),
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    } else {
      // FAULT
      faults++;
      const emptySlot = newFrames.findIndex(f => f.page === null);
      let replaceIdx: number;

      if (emptySlot !== -1) {
        replaceIdx = emptySlot;
      } else {
        // Reemplazar el frame con el contador más alto (más envejecido).
        // Desempate: el menos recientemente usado (lastUsed más bajo).
        replaceIdx = newFrames.reduce((maxIdx, f, i) => {
          const maxF = newFrames[maxIdx];
          if (f.agingCounter > maxF.agingCounter) return i;
          if (f.agingCounter === maxF.agingCounter && f.lastUsed < maxF.lastUsed) return i;
          return maxIdx;
        }, 0);
      }

      newFrames[replaceIdx].page = page;
      newFrames[replaceIdx].isNew = true;
      newFrames[replaceIdx].isReplaced = emptySlot === -1;
      newFrames[replaceIdx].agingCounter = 1; // recién cargada = edad 1
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

function buildVars(frames: ReturnType<typeof cloneFrames>): AgingVariables {
  return {
    type: 'AGING',
    counters: frames.map(f => ({ page: f.page, counter: f.agingCounter })),
  };
}
