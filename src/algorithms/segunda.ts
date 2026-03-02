import type { Snapshot, SegundaVariables } from '../types';
import { emptyFrame, cloneFrames } from './utils';

// Segunda Oportunidad: extensión de FIFO con bit de referencia R.
//
// Se mantiene una cola FIFO de frames. En cada fallo:
//   1. Se inspecciona el frente de la cola.
//   2. Si R=1 → se da segunda oportunidad: R=0 y el frame pasa al FINAL de la cola.
//   3. Si R=0 → se reemplaza esa página.
// En cada hit: R=1 del frame accedido.
//
// Diferencia con Clock: la cola se reordena físicamente al dar segunda oportunidad
// (Clock solo mueve un puntero, los frames no cambian de posición).

export function runSegunda(sequence: number[], frameCount: number): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let frames = Array.from({ length: frameCount }, (_, i) => emptyFrame(i));
  let queue: number[] = []; // índices de frames en orden FIFO (0 = frente)
  let faults = 0;
  let hits = 0;

  for (let step = 0; step < sequence.length; step++) {
    const page = sequence[step];
    const newFrames = cloneFrames(frames);
    let newQueue = [...queue];

    const hitIndex = newFrames.findIndex(f => f.page === page);

    if (hitIndex !== -1) {
      // HIT: activar bit de referencia
      hits++;
      newFrames[hitIndex].isHit = true;
      newFrames[hitIndex].clockBit = true; // R=1

      snapshots.push({
        step, page, frames: newFrames,
        isFault: false, replacedFrameIndex: null,
        variables: buildVars(newFrames, newQueue, 0),
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    } else {
      // FAULT
      faults++;
      const emptySlot = newFrames.findIndex(f => f.page === null);
      let replaceIdx = 0;
      let stepsChecked = 0;

      if (emptySlot !== -1) {
        // Frame libre: cargar directamente
        replaceIdx = emptySlot;
        newQueue.push(replaceIdx);
      } else {
        // Buscar víctima recorriendo la cola
        while (true) {
          const candidate = newQueue[0];
          if (!newFrames[candidate].clockBit) {
            // R=0 → víctima encontrada
            replaceIdx = candidate;
            newQueue.shift();        // sacar del frente
            break;
          } else {
            // R=1 → segunda oportunidad: R=0, mover al final de la cola
            newFrames[candidate].clockBit = false;
            newQueue.push(newQueue.shift()!);
            stepsChecked++;
          }
        }
        // La página nueva entra al final de la cola
        newQueue.push(replaceIdx);
      }

      newFrames[replaceIdx].page = page;
      newFrames[replaceIdx].isNew = true;
      newFrames[replaceIdx].isReplaced = emptySlot === -1;
      newFrames[replaceIdx].clockBit = false; // R=0 al cargar

      snapshots.push({
        step, page, frames: newFrames,
        isFault: true, replacedFrameIndex: replaceIdx,
        variables: buildVars(newFrames, newQueue, stepsChecked),
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    }

    frames = newFrames;
    queue = newQueue;
  }

  return snapshots;
}

function buildVars(
  frames: ReturnType<typeof cloneFrames>,
  queue: number[],
  stepsChecked: number,
): SegundaVariables {
  return {
    type: 'SEGUNDA',
    queue: queue.map(fi => ({
      frameIdx: fi,
      page: frames[fi].page,
      refBit: frames[fi].clockBit,
    })),
    stepsChecked,
  };
}
