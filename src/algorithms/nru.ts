import type { Snapshot, NRUVariables } from '../types';
import { emptyFrame, cloneFrames } from './utils';

// NRU: Not Recently Used
// Clases: 0 (R=0,M=0), 1 (R=0,M=1), 2 (R=1,M=0), 3 (R=1,M=1)
// Se resetea el bit R cada RESET_INTERVAL pasos
const RESET_INTERVAL = 4;

function nruClass(bitR: boolean, bitM: boolean): number {
  if (!bitR && !bitM) return 0;
  if (!bitR && bitM) return 1;
  if (bitR && !bitM) return 2;
  return 3;
}

export function runNRU(
  sequence: number[],
  frameCount: number,
  dirtyOverrides: Record<number, boolean> = {},
): Snapshot[] {
  const snapshots: Snapshot[] = [];
  let frames = Array.from({ length: frameCount }, (_, i) => emptyFrame(i));
  let tickCount = 0;
  let faults = 0;
  let hits = 0;

  // Bit M base por página: seed determinístico, puede ser sobreescrito por override de paso
  const dirtySeed = (page: number) => ((page * 1103515245 + 12345) & 0x7fffffff) % 3 === 0;

  // Resuelve el bit M para un paso concreto:
  // Si hay override para ese step, lo usa; si no, usa la seed de la página
  const resolveM = (step: number, page: number): boolean =>
    step in dirtyOverrides ? dirtyOverrides[step] : dirtySeed(page);

  for (let step = 0; step < sequence.length; step++) {
    const page = sequence[step];
    let newFrames = cloneFrames(frames);

    // Resetear bits R periódicamente
    if (step > 0 && step % RESET_INTERVAL === 0) {
      tickCount++;
      newFrames = newFrames.map(f => ({ ...f, bitR: false }));
    }

    const hitIndex = newFrames.findIndex(f => f.page === page);

    if (hitIndex !== -1) {
      hits++;
      newFrames[hitIndex].isHit = true;
      newFrames[hitIndex].bitR = true;
      // Aplicar M según override o seed
      if (resolveM(step, page)) newFrames[hitIndex].bitM = true;

      const vars = buildVars(newFrames, null, tickCount);
      snapshots.push({
        step, page, frames: newFrames,
        isFault: false, replacedFrameIndex: null,
        variables: vars,
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    } else {
      faults++;
      const emptySlot = newFrames.findIndex(f => f.page === null);
      let replaceIdx: number;
      let selectedClass: number | null = null;

      if (emptySlot !== -1) {
        replaceIdx = emptySlot;
      } else {
        // Encontrar la clase más baja con algún frame
        for (let cls = 0; cls <= 3; cls++) {
          const candidates = newFrames
            .map((f, i) => ({ i, cls: nruClass(f.bitR, f.bitM) }))
            .filter(x => x.cls === cls);
          if (candidates.length > 0) {
            selectedClass = cls;
            replaceIdx = candidates[0].i;
            break;
          }
        }
        replaceIdx = replaceIdx!;
      }

      newFrames[replaceIdx].page = page;
      newFrames[replaceIdx].isNew = true;
      newFrames[replaceIdx].isReplaced = emptySlot === -1;
      newFrames[replaceIdx].bitR = true;
      newFrames[replaceIdx].bitM = resolveM(step, page);

      const vars = buildVars(newFrames, selectedClass, tickCount);
      snapshots.push({
        step, page, frames: newFrames,
        isFault: true, replacedFrameIndex: replaceIdx,
        variables: vars,
        cumulativeFaults: faults, cumulativeHits: hits,
      });
    }

    frames = newFrames;
  }

  return snapshots;
}

function buildVars(
  frames: ReturnType<typeof cloneFrames>,
  selectedClass: number | null,
  tickCount: number,
): NRUVariables {
  return {
    type: 'NRU',
    frames: frames.map(f => ({
      page: f.page,
      bitR: f.bitR,
      bitM: f.bitM,
      class: nruClass(f.bitR, f.bitM),
    })),
    selectedClass,
    tickCount,
  };
}
