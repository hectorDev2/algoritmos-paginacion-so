// ─── Tipos base ───────────────────────────────────────────────────────────────

export type AlgorithmId = 'FIFO' | 'LRU' | 'NRU' | 'OPT' | 'CLOCK' | 'LFU';

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
  | LFUVariables;

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
  | { type: 'RESET' };
