// ─── Tipos base ───────────────────────────────────────────────────────────────

export type AlgorithmId = 'FIFO' | 'LRU' | 'NRU' | 'OPT' | 'CLOCK' | 'LFU' | 'MFU' | 'AGING' | 'SEGUNDA';

export interface FrameState {
  frameIndex: number;       // índice del frame (0..n-1)
  page: number | null;      // página almacenada (-1 = vacío)
  isNew: boolean;           // recién cargada en este paso
  isReplaced: boolean;      // fue reemplazada en este paso
  isHit: boolean;           // fue un hit en este paso
  // bits NRU
  bitR: boolean;
  bitM: boolean;
  // Clock
  clockBit: boolean;
  // LRU
  lastUsed: number;         // timestamp del último uso
  // LFU
  frequency: number;        // contador de frecuencia
  // FIFO
  arrivalOrder: number;     // orden de llegada
  // Aging
  agingCounter: number;     // contador de envejecimiento (8 bits)
}

export interface Snapshot {
  step: number;                        // índice del paso (0-based)
  page: number;                        // página procesada en este paso
  frames: FrameState[];                // estado de todos los frames
  isFault: boolean;                    // ¿fue fallo de página?
  replacedFrameIndex: number | null;   // qué frame fue reemplazado
  clockPointer?: number;               // puntero del reloj (Clock)
  fifoPointer?: number;                // puntero FIFO
  variables: AlgorithmVariables;       // variables visibles del algoritmo
  cumulativeFaults: number;            // fallos acumulados hasta este paso
  cumulativeHits: number;              // hits acumulados hasta este paso
}

// Variables visibles por algoritmo en el panel de variables
export type AlgorithmVariables =
  | FIFOVariables
  | LRUVariables
  | NRUVariables
  | OPTVariables
  | CLOCKVariables
  | LFUVariables
  | MFUVariables
  | AgingVariables
  | SegundaVariables;

export interface FIFOVariables {
  type: 'FIFO';
  pointer: number;
  queue: number[];          // orden de páginas en el queue
}

export interface LRUVariables {
  type: 'LRU';
  timestamps: { page: number | null; lastUsed: number }[];
}

export interface NRUVariables {
  type: 'NRU';
  frames: { page: number | null; bitR: boolean; bitM: boolean; class: number }[];
  selectedClass: number | null;
  tickCount: number;        // cuántas veces se resetearon los bits R
}

export interface OPTVariables {
  type: 'OPT';
  nextUse: { page: number | null; nextAt: number | string }[];
}

export interface CLOCKVariables {
  type: 'CLOCK';
  pointer: number;
  frames: { page: number | null; secondChanceBit: boolean }[];
  stepsToReplace: number;   // cuántos frames se recorrieron buscando víctima
}

export interface LFUVariables {
  type: 'LFU';
  frequencies: { page: number | null; freq: number }[];
}

export interface MFUVariables {
  type: 'MFU';
  frequencies: { page: number | null; freq: number }[];
}

export interface AgingVariables {
  type: 'AGING';
  counters: { page: number | null; counter: number }[];
}

export interface SegundaVariables {
  type: 'SEGUNDA';
  // Cola FIFO en orden (índice 0 = frente, próximo candidato)
  queue: { frameIdx: number; page: number | null; refBit: boolean }[];
  stepsChecked: number; // páginas que recibieron segunda oportunidad en este paso
}

// ─── Métricas de simulación ───────────────────────────────────────────────────

export interface SimulationMetrics {
  executionTimeMs: number;       // tiempo real de cómputo en ms
  referencesPerMs: number;       // referencias procesadas por ms
  framesAllocated: number;       // número de frames configurados
  uniquePagesTotal: number;      // páginas únicas en la secuencia
  peakFramesOccupied: number;    // máximo de frames ocupados a la vez
  pagesEvicted: number;          // reemplazos reales (frames llenos al fallar)
  memorySimulatedKB: number;     // frameCount × 4 KB
  totalSyscalls: number;         // = totalFaults (1 trap/fallo)
  diskReads: number;             // = totalFaults (1 lectura de disco/fallo)
  pageFaultInterrupts: number;   // = totalFaults
  extraInterrupts: number;       // CLOCK: pasos buscando víctima; NRU: tickCount
  totalInterrupts: number;       // pageFaultInterrupts + extraInterrupts
  totalFaults: number;
  totalHits: number;
  totalSteps: number;
}

// ─── Estado global del simulador ──────────────────────────────────────────────

export interface SimulatorState {
  algorithm: AlgorithmId;
  pageSequence: number[];     // secuencia de páginas ingresada
  frameCount: number;         // número de frames disponibles
  snapshots: Snapshot[];      // todos los pasos pre-calculados
  currentStep: number;        // paso actual (índice en snapshots)
  isPlaying: boolean;
  playSpeed: number;          // ms entre pasos
  isConfigured: boolean;      // si ya se corrió la simulación
  // NRU: override manual del bit M por paso (step → true/false)
  dirtyOverrides: Record<number, boolean>;
  metrics: SimulationMetrics | null;
}

export type SimulatorAction =
  | { type: 'SET_ALGORITHM'; payload: AlgorithmId }
  | { type: 'SET_SEQUENCE'; payload: number[] }
  | { type: 'SET_FRAME_COUNT'; payload: number }
  | { type: 'RUN_SIMULATION' }
  | { type: 'STEP_FORWARD' }
  | { type: 'STEP_BACKWARD' }
  | { type: 'GO_TO_START' }
  | { type: 'GO_TO_END' }
  | { type: 'GO_TO_STEP'; payload: number }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'SET_SPEED'; payload: number }
  | { type: 'RESET' }
  | { type: 'TOGGLE_DIRTY'; payload: number }; // payload = step index
