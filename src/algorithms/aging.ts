import type { Snapshot, AgingVariables } from '../types';
import { emptyFrame, cloneFrames } from './utils';

// Aging: aproximación a LRU mediante contador de 8 bits por frame.
// En cada paso:
//   1. Desplazar todos los contadores un bit a la derecha (>>= 1).
//   2. Si la página referenciada estaba en memoria (hit) → activar el MSB (|= 0x80).
//   3. Si hubo fallo → reemplazar el frame con el contador más bajo; al cargar,
//      su contador se inicializa con el MSB activo (0x80).
// Desempate: menor contador → mayor LRU si empatan.

const MSB = 0x80;  // 1000 0000

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

    // Paso 1: desplazar todos los contadores a la derecha (envejecimiento)
    newFrames = newFrames.map(f => ({
      ...f,
      agingCounter: f.page !== null ? (f.agingCounter >>> 1) & 0xFF : 0,
    }));

    const hitIndex = newFrames.findIndex(f => f.page === page);

    if (hitIndex !== -1) {
      // HIT: activar MSB del frame accedido
      hits++;
      newFrames[hitIndex].isHit = true;
      newFrames[hitIndex].agingCounter = (newFrames[hitIndex].agingCounter | MSB) & 0xFF;
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
        // Reemplazar el frame con el contador más bajo.
        // Desempate: el menos recientemente usado (lastUsed más bajo).
        replaceIdx = newFrames.reduce((minIdx, f, i) => {
          const minF = newFrames[minIdx];
          if (f.agingCounter < minF.agingCounter) return i;
          if (f.agingCounter === minF.agingCounter && f.lastUsed < minF.lastUsed) return i;
          return minIdx;
        }, 0);
      }

      newFrames[replaceIdx].page = page;
      newFrames[replaceIdx].isNew = true;
      newFrames[replaceIdx].isReplaced = emptySlot === -1;
      // La página recién cargada fue referenciada en este paso → MSB activo
      newFrames[replaceIdx].agingCounter = MSB;
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
