import { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import type { SimulatorState, SimulatorAction, AlgorithmId } from '../types';
import { runFIFO, runLRU, runNRU, runOPT, runClock, runLFU } from '../algorithms';

// ─── Estado inicial ────────────────────────────────────────────────────────────

const initialState: SimulatorState = {
  algorithm: 'FIFO',
  pageSequence: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
  frameCount: 3,
  snapshots: [],
  currentStep: 0,
  isPlaying: false,
  playSpeed: 1000,
  isConfigured: false,
};

// ─── Función que ejecuta el algoritmo elegido ──────────────────────────────────

function computeSnapshots(algorithm: AlgorithmId, sequence: number[], frameCount: number) {
  switch (algorithm) {
    case 'FIFO':  return runFIFO(sequence, frameCount);
    case 'LRU':   return runLRU(sequence, frameCount);
    case 'NRU':   return runNRU(sequence, frameCount);
    case 'OPT':   return runOPT(sequence, frameCount);
    case 'CLOCK': return runClock(sequence, frameCount);
    case 'LFU':   return runLFU(sequence, frameCount);
    default:      return runFIFO(sequence, frameCount);
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function simulatorReducer(state: SimulatorState, action: SimulatorAction): SimulatorState {
  switch (action.type) {
    case 'SET_ALGORITHM':
      return { ...state, algorithm: action.payload, isConfigured: false, snapshots: [], currentStep: 0, isPlaying: false };

    case 'SET_SEQUENCE':
      return { ...state, pageSequence: action.payload, isConfigured: false, snapshots: [], currentStep: 0, isPlaying: false };

    case 'SET_FRAME_COUNT':
      return { ...state, frameCount: action.payload, isConfigured: false, snapshots: [], currentStep: 0, isPlaying: false };

    case 'RUN_SIMULATION': {
      const snapshots = computeSnapshots(state.algorithm, state.pageSequence, state.frameCount);
      return { ...state, snapshots, currentStep: 0, isConfigured: true, isPlaying: false };
    }

    case 'STEP_FORWARD':
      if (state.currentStep >= state.snapshots.length - 1) return { ...state, isPlaying: false };
      return { ...state, currentStep: state.currentStep + 1 };

    case 'STEP_BACKWARD':
      if (state.currentStep <= 0) return state;
      return { ...state, currentStep: state.currentStep - 1 };

    case 'GO_TO_START':
      return { ...state, currentStep: 0, isPlaying: false };

    case 'GO_TO_END':
      return { ...state, currentStep: state.snapshots.length - 1, isPlaying: false };

    case 'GO_TO_STEP':
      return { ...state, currentStep: Math.max(0, Math.min(action.payload, state.snapshots.length - 1)) };

    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };

    case 'SET_SPEED':
      return { ...state, playSpeed: action.payload };

    case 'RESET':
      return { ...initialState };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface SimulatorContextType {
  state: SimulatorState;
  dispatch: React.Dispatch<SimulatorAction>;
}

const SimulatorContext = createContext<SimulatorContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SimulatorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(simulatorReducer, initialState);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-play logic
  useEffect(() => {
    if (state.isPlaying && state.isConfigured) {
      timerRef.current = setInterval(() => {
        dispatch({ type: 'STEP_FORWARD' });
      }, state.playSpeed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [state.isPlaying, state.playSpeed, state.isConfigured]);

  // Detener automáticamente al llegar al final
  useEffect(() => {
    if (state.isConfigured && state.currentStep >= state.snapshots.length - 1 && state.isPlaying) {
      dispatch({ type: 'TOGGLE_PLAY' });
    }
  }, [state.currentStep, state.snapshots.length, state.isPlaying, state.isConfigured]);

  return (
    <SimulatorContext.Provider value={{ state, dispatch }}>
      {children}
    </SimulatorContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSimulator() {
  const ctx = useContext(SimulatorContext);
  if (!ctx) throw new Error('useSimulator must be used within SimulatorProvider');
  return ctx;
}

export function useSimulatorActions() {
  const { dispatch } = useSimulator();

  return {
    setAlgorithm: useCallback((a: AlgorithmId) => dispatch({ type: 'SET_ALGORITHM', payload: a }), [dispatch]),
    setSequence: useCallback((s: number[]) => dispatch({ type: 'SET_SEQUENCE', payload: s }), [dispatch]),
    setFrameCount: useCallback((n: number) => dispatch({ type: 'SET_FRAME_COUNT', payload: n }), [dispatch]),
    runSimulation: useCallback(() => dispatch({ type: 'RUN_SIMULATION' }), [dispatch]),
    stepForward: useCallback(() => dispatch({ type: 'STEP_FORWARD' }), [dispatch]),
    stepBackward: useCallback(() => dispatch({ type: 'STEP_BACKWARD' }), [dispatch]),
    goToStart: useCallback(() => dispatch({ type: 'GO_TO_START' }), [dispatch]),
    goToEnd: useCallback(() => dispatch({ type: 'GO_TO_END' }), [dispatch]),
    goToStep: useCallback((n: number) => dispatch({ type: 'GO_TO_STEP', payload: n }), [dispatch]),
    togglePlay: useCallback(() => dispatch({ type: 'TOGGLE_PLAY' }), [dispatch]),
    setSpeed: useCallback((ms: number) => dispatch({ type: 'SET_SPEED', payload: ms }), [dispatch]),
    reset: useCallback(() => dispatch({ type: 'RESET' }), [dispatch]),
  };
}
