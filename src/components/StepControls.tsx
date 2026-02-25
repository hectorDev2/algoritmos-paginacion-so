import { useSimulator, useSimulatorActions } from '../store/simulatorStore';

const SPEEDS = [
  { label: '0.5×', ms: 2000 },
  { label: '1×',   ms: 1000 },
  { label: '2×',   ms: 500  },
  { label: '4×',   ms: 250  },
];

export function StepControls() {
  const { state } = useSimulator();
  const { stepBackward, stepForward, goToStart, goToEnd, togglePlay, setSpeed, goToStep } = useSimulatorActions();

  const off      = !state.isConfigured || state.snapshots.length === 0;
  const atStart  = state.currentStep <= 0;
  const atEnd    = state.currentStep >= state.snapshots.length - 1;

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">Controles de paso</h2>
        {state.isConfigured && (
          <span className="text-xs font-mono text-slate-500">
            {state.currentStep + 1} / {state.snapshots.length}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col gap-4">

        {/* ── Botones principales ── */}
        <div className="flex items-center justify-center gap-2">
          <NavBtn onClick={goToStart}    disabled={off || atStart} title="Ir al inicio">⏮</NavBtn>
          <NavBtn onClick={stepBackward} disabled={off || atStart} title="Paso anterior">◀</NavBtn>

          {/* Play / Pause — botón principal */}
          <button
            onClick={togglePlay}
            disabled={off || atEnd}
            title={state.isPlaying ? 'Pausar' : 'Reproducir'}
            className={`
              w-14 h-11 rounded-xl font-bold text-base transition-all duration-150
              flex items-center justify-center cursor-pointer
              ${state.isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-900'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/40'}
              disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed disabled:shadow-none
            `}
          >
            {state.isPlaying ? '⏸' : '▶'}
          </button>

          <NavBtn onClick={stepForward} disabled={off || atEnd}    title="Paso siguiente">▶</NavBtn>
          <NavBtn onClick={goToEnd}     disabled={off || atEnd}    title="Ir al final">⏭</NavBtn>
        </div>

        {/* ── Scrubber ── */}
        {state.isConfigured && state.snapshots.length > 1 && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-600 w-4 text-right shrink-0">1</span>
            <input
              type="range"
              min={0}
              max={state.snapshots.length - 1}
              value={state.currentStep}
              onChange={e => goToStep(Number(e.target.value))}
              className="flex-1 accent-indigo-500 cursor-pointer h-1.5"
            />
            <span className="text-[11px] text-slate-600 w-4 shrink-0">{state.snapshots.length}</span>
          </div>
        )}

        {/* ── Velocidad ── */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Velocidad de reproducción
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            {SPEEDS.map(s => (
              <button
                key={s.ms}
                onClick={() => setSpeed(s.ms)}
                className={`
                  h-8 rounded-lg text-xs font-bold cursor-pointer transition-all duration-150
                  ${state.playSpeed === s.ms
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/40'
                    : 'bg-slate-800 text-slate-400 border border-slate-700/60 hover:border-slate-600 hover:text-slate-300'}
                `}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavBtn({
  onClick, disabled, title, children,
}: { onClick: () => void; disabled: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="
        w-10 h-11 rounded-xl bg-slate-800 border border-slate-700/60 text-slate-300 font-bold text-base
        hover:bg-slate-700 hover:border-slate-600 hover:text-white
        disabled:bg-slate-800/40 disabled:border-slate-800 disabled:text-slate-700 disabled:cursor-not-allowed
        transition-all duration-150 cursor-pointer flex items-center justify-center
      "
    >
      {children}
    </button>
  );
}
