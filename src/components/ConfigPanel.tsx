import { useState } from 'react';
import { useSimulator, useSimulatorActions } from '../store/simulatorStore';
import type { AlgorithmId } from '../types';

const ALGORITHMS: { id: AlgorithmId; label: string; description: string; dot: string }[] = [
  { id: 'FIFO',  label: 'FIFO',  description: 'First In, First Out',     dot: 'bg-blue-400' },
  { id: 'LRU',   label: 'LRU',   description: 'Least Recently Used',     dot: 'bg-purple-400' },
  { id: 'NRU',   label: 'NRU',   description: 'Not Recently Used',       dot: 'bg-yellow-400' },
  { id: 'OPT',   label: 'OPT',   description: 'Óptimo (Belady)',         dot: 'bg-green-400' },
  { id: 'CLOCK', label: 'Clock', description: 'Segunda Oportunidad',     dot: 'bg-orange-400' },
  { id: 'LFU',   label: 'LFU',   description: 'Least Frequently Used',   dot: 'bg-pink-400' },
];

export function ConfigPanel() {
  const { state } = useSimulator();
  const { setAlgorithm, setSequence, setFrameCount, runSimulation, reset } = useSimulatorActions();
  const [inputText, setInputText] = useState(state.pageSequence.join(', '));
  const [error, setError] = useState<string | null>(null);

  function handleSequenceChange(raw: string) {
    setInputText(raw);
    const parts = raw.split(/[\s,;]+/).filter(Boolean);
    if (parts.length === 0) { setError('Ingresa al menos una página'); return; }
    const nums = parts.map(Number);
    if (nums.some(isNaN)) { setError('Solo se permiten números separados por comas'); return; }
    setError(null);
    setSequence(nums);
  }

  function handleRun() {
    if (error || state.pageSequence.length === 0) return;
    runSimulation();
  }

  function handleReset() {
    setInputText('1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5');
    setError(null);
    reset();
  }

  const selectedAlgo = ALGORITHMS.find(a => a.id === state.algorithm)!;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden">

      {/* Panel header */}
      <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Configuración</h2>
        <button
          onClick={handleReset}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          Reiniciar
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">

        {/* ── Selector de algoritmo ── */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Algoritmo
          </p>
          <div className="grid grid-cols-3 gap-2">
            {ALGORITHMS.map(alg => {
              const isActive = state.algorithm === alg.id;
              return (
                <button
                  key={alg.id}
                  onClick={() => setAlgorithm(alg.id)}
                  className={`
                    group relative rounded-xl p-3 text-left border transition-all duration-150 cursor-pointer
                    ${isActive
                      ? 'border-indigo-500 bg-indigo-600/10 shadow-sm shadow-indigo-500/10'
                      : 'border-slate-700/60 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'}
                  `}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${alg.dot}`} />
                    <span className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {alg.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight pl-3.5">
                    {alg.description}
                  </p>
                  {isActive && (
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Secuencia de páginas ── */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
              Secuencia de páginas
            </p>
            {!error && state.pageSequence.length > 0 && (
              <span className="text-[11px] text-slate-500">
                {state.pageSequence.length} referencias
              </span>
            )}
          </div>
          <textarea
            rows={3}
            value={inputText}
            onChange={e => handleSequenceChange(e.target.value)}
            placeholder="Ej: 1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5"
            className={`
              w-full bg-slate-800 text-slate-100 text-sm font-mono placeholder-slate-600
              rounded-xl border px-4 py-3 outline-none resize-none
              transition-colors duration-150
              ${error
                ? 'border-red-500/70 focus:border-red-400'
                : 'border-slate-700/60 focus:border-indigo-500/80'}
            `}
          />
          {error && (
            <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
          )}
        </div>

        {/* ── Número de marcos ── */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Número de marcos
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => state.frameCount > 1 && setFrameCount(state.frameCount - 1)}
              className="w-9 h-9 shrink-0 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300
                         hover:bg-slate-700 hover:border-slate-600 transition-colors text-lg font-bold
                         flex items-center justify-center cursor-pointer disabled:opacity-40"
              disabled={state.frameCount <= 1}
            >
              −
            </button>
            <input
              type="number"
              min={1}
              max={20}
              value={state.frameCount}
              onChange={e => {
                const v = parseInt(e.target.value, 10);
                if (!isNaN(v) && v >= 1 && v <= 20) setFrameCount(v);
              }}
              className="flex-1 h-9 bg-slate-800 border border-slate-700/60 focus:border-indigo-500/80
                         text-indigo-300 font-black text-xl text-center rounded-lg outline-none
                         transition-colors duration-150"
            />
            <button
              onClick={() => state.frameCount < 20 && setFrameCount(state.frameCount + 1)}
              className="w-9 h-9 shrink-0 rounded-lg bg-slate-800 border border-slate-700/60 text-slate-300
                         hover:bg-slate-700 hover:border-slate-600 transition-colors text-lg font-bold
                         flex items-center justify-center cursor-pointer disabled:opacity-40"
              disabled={state.frameCount >= 20}
            >
              +
            </button>
          </div>
          <p className="text-[11px] text-slate-600 mt-1.5 text-center">
            {state.frameCount} {state.frameCount === 1 ? 'marco' : 'marcos'} · rango 1–20
          </p>
        </div>

        {/* ── Botón ejecutar ── */}
        <button
          onClick={handleRun}
          disabled={!!error || state.pageSequence.length === 0}
          className="
            w-full h-11 rounded-xl font-semibold text-sm tracking-wide cursor-pointer
            bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white
            disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed
            transition-colors duration-150 shadow-lg shadow-indigo-900/30
            flex items-center justify-center gap-2
          "
        >
          <span>▶</span>
          <span>
            {state.isConfigured
              ? `Re-ejecutar con ${selectedAlgo.label}`
              : `Ejecutar ${selectedAlgo.label}`}
          </span>
        </button>
      </div>
    </div>
  );
}
