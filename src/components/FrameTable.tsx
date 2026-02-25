import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSimulator, useSimulatorActions } from '../store/simulatorStore';

const ALGO_ACCENT_BG: Record<string, string> = {
  FIFO:  'bg-blue-500',
  LRU:   'bg-purple-500',
  NRU:   'bg-yellow-500',
  OPT:   'bg-green-500',
  CLOCK: 'bg-orange-500',
  LFU:   'bg-pink-500',
};
const ALGO_BORDER: Record<string, string> = {
  FIFO:  'border-blue-500',
  LRU:   'border-purple-500',
  NRU:   'border-yellow-500',
  OPT:   'border-green-500',
  CLOCK: 'border-orange-500',
  LFU:   'border-pink-500',
};
const ALGO_TEXT: Record<string, string> = {
  FIFO:  'text-blue-400',
  LRU:   'text-purple-400',
  NRU:   'text-yellow-400',
  OPT:   'text-green-400',
  CLOCK: 'text-orange-400',
  LFU:   'text-pink-400',
};
const ALGO_SUBTEXT: Record<string, string> = {
  FIFO:  'text-blue-400/70',
  LRU:   'text-purple-400/70',
  NRU:   'text-yellow-400/70',
  OPT:   'text-green-400/70',
  CLOCK: 'text-orange-400/70',
  LFU:   'text-pink-400/70',
};

export function FrameTable() {
  const { state } = useSimulator();
  const { goToStep } = useSimulatorActions();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeColRef = useRef<HTMLTableCellElement>(null);

  // Auto-scroll para mantener columna activa visible
  useEffect(() => {
    if (!activeColRef.current || !scrollRef.current) return;
    const container = scrollRef.current;
    const cell = activeColRef.current;
    const cellLeft = cell.offsetLeft;
    const cellWidth = cell.offsetWidth;
    const containerLeft = container.scrollLeft;
    const containerWidth = container.clientWidth;
    if (cellLeft < containerLeft + 100) {
      container.scrollTo({ left: cellLeft - 100, behavior: 'smooth' });
    } else if (cellLeft + cellWidth > containerLeft + containerWidth - 100) {
      container.scrollTo({ left: cellLeft + cellWidth - containerWidth + 100, behavior: 'smooth' });
    }
  }, [state.currentStep]);

  if (!state.isConfigured || state.snapshots.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-700/60 flex flex-col
                      items-center justify-center min-h-56 gap-3 p-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700/60
                        flex items-center justify-center text-3xl select-none">
          🗂️
        </div>
        <p className="text-slate-400 text-sm font-medium">Configura y ejecuta la simulación</p>
        <p className="text-slate-600 text-xs">La tabla de marcos aparecerá aquí</p>
      </div>
    );
  }

  const { snapshots, currentStep, algorithm, frameCount } = state;
  const currentSnap = snapshots[currentStep];
  const accentBg   = ALGO_ACCENT_BG[algorithm] ?? 'bg-indigo-500';
  const accentBorder = ALGO_BORDER[algorithm] ?? 'border-indigo-500';
  const accentText   = ALGO_TEXT[algorithm]   ?? 'text-indigo-400';
  const accentSub    = ALGO_SUBTEXT[algorithm] ?? 'text-indigo-400/70';

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden">

      {/* ── Header ── */}
      <div className="px-5 py-4 border-b border-slate-700/60 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-200 mr-auto">
          Tabla de Marcos
        </h2>

        {/* Badge paso actual */}
        <div className={`flex items-center gap-2.5 rounded-xl border ${accentBorder} bg-slate-800 px-3.5 py-2`}>
          <span className="text-[11px] text-slate-500 font-medium">
            Paso {currentStep + 1}/{snapshots.length}
          </span>
          <span className="w-px h-3 bg-slate-600" />
          <span className="text-sm font-black text-white">Pág. {currentSnap.page}</span>
          {currentSnap.isFault
            ? <span className="text-[11px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-2 py-0.5">FALLO</span>
            : <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-md px-2 py-0.5">HIT</span>
          }
        </div>

        {/* Leyenda */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-green-700/80 border border-green-500/60" />
            Nueva
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-blue-800/80 border border-blue-500/60" />
            Hit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-red-900/80 border border-red-500/60" />
            Reemplazada
          </span>
        </div>
      </div>

      {/* ── Tabla scrolleable ── */}
      <div ref={scrollRef} className="overflow-x-auto">
        <div className="px-5 pt-4 pb-2">
          <table className="border-separate border-spacing-0">
            <thead>
              <tr>
                {/* Etiqueta fija izquierda */}
                <th className="sticky left-0 z-20 bg-slate-900 w-24 min-w-24 pr-4 pb-3 text-left align-bottom">
                  <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">
                    Tiempo →
                  </span>
                </th>

                {/* Columnas de tiempo */}
                {snapshots.map((snap, col) => {
                  const isCurrent = col === currentStep;
                  const isPast    = col < currentStep;
                  return (
                    <th
                      key={col}
                      ref={isCurrent ? activeColRef : undefined}
                      onClick={() => goToStep(col)}
                      className="w-12 min-w-12 pb-3 align-bottom text-center cursor-pointer
                                 select-none group"
                    >
                      {/* Número del paso */}
                      <div className={`text-[10px] font-semibold mb-1.5 transition-colors
                        ${isCurrent ? 'text-white' : isPast ? 'text-slate-500' : 'text-slate-700'}`}>
                        {col + 1}
                      </div>
                      {/* Celda de la página de referencia */}
                      <div className={`
                        mx-auto w-10 h-10 rounded-xl flex items-center justify-center
                        font-black text-sm border-2 transition-all duration-150
                        ${isCurrent
                          ? `${accentBg} border-transparent text-white shadow-md`
                          : isPast
                            ? snap.isFault
                              ? 'bg-red-500/10 border-red-500/40 text-red-300'
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                            : 'bg-slate-800 border-slate-700/60 text-slate-600 group-hover:border-slate-600'}
                      `}>
                        {snap.page}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody>
              {/* Separador visual */}
              <tr>
                <td colSpan={snapshots.length + 1} className="pt-0 pb-1">
                  <div className="h-px bg-slate-700/40" />
                </td>
              </tr>

              {/* ── Filas de marcos ── */}
              {Array.from({ length: frameCount }, (_, frameIdx) => (
                <tr key={frameIdx}>
                  {/* Etiqueta del frame */}
                  <td className="sticky left-0 z-20 bg-slate-900 pr-4 py-1 align-middle">
                    <div className="flex items-center gap-2">
                      <div className={`w-1 h-6 rounded-full ${accentBg} opacity-50`} />
                      <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                        Marco {frameIdx}
                      </span>
                    </div>
                  </td>

                  {/* Celdas de datos */}
                  {snapshots.map((snap, col) => {
                    const frame = snap.frames[frameIdx];
                    const isCurrent = col === currentStep;
                    const isEmpty   = frame.page === null;

                    let cellBg     = 'bg-slate-800/60 border-slate-700/40';
                    let valueColor = 'text-slate-600';

                    if (!isEmpty) {
                      if (frame.isNew)      { cellBg = 'bg-green-500/10 border-green-500/50'; valueColor = 'text-green-300'; }
                      else if (frame.isHit) { cellBg = 'bg-blue-500/10 border-blue-500/40';  valueColor = 'text-blue-300'; }
                      else if (frame.isReplaced) { cellBg = 'bg-red-500/10 border-red-500/50'; valueColor = 'text-red-300'; }
                      else                  { cellBg = 'bg-slate-800 border-slate-700/60';   valueColor = 'text-slate-200'; }
                    }

                    // Sub-info por algoritmo (non-NRU)
                    let subInfo: React.ReactNode = null;
                    if (!isEmpty && algorithm !== 'NRU') {
                      if (algorithm === 'CLOCK')
                        subInfo = <span className={`text-[9px] font-mono ${frame.clockBit ? accentSub : 'text-slate-600'}`}>{frame.clockBit ? '●' : '○'}</span>;
                      else if (algorithm === 'LFU')
                        subInfo = <span className={`text-[9px] font-mono ${accentSub}`}>f{frame.frequency}</span>;
                      else if (algorithm === 'LRU')
                        subInfo = <span className={`text-[9px] font-mono ${accentSub}`}>t{frame.lastUsed}</span>;
                      else if (algorithm === 'FIFO')
                        subInfo = <span className={`text-[9px] font-mono ${accentSub}`}>#{frame.arrivalOrder}</span>;
                    }

                    // ── Celda NRU: diseño expandido con badges R y M ──
                    if (algorithm === 'NRU') {
                      const nruClass = (!frame.bitR && !frame.bitM) ? 0
                        : (!frame.bitR && frame.bitM) ? 1
                        : (frame.bitR && !frame.bitM) ? 2 : 3;
                      const classColors = [
                        'text-green-400',   // C0
                        'text-yellow-400',  // C1
                        'text-orange-400',  // C2
                        'text-red-400',     // C3
                      ];
                      return (
                        <td
                          key={col}
                          onClick={() => goToStep(col)}
                          className={`py-1 px-0.5 cursor-pointer transition-colors duration-100
                            ${isCurrent ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                        >
                          <motion.div
                            key={`${frameIdx}-${col}-${frame.page}-${frame.bitR?1:0}-${frame.bitM?1:0}`}
                            initial={frame.isNew || frame.isReplaced ? { scale: 0.65, opacity: 0 } : false}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.18, ease: 'easeOut' }}
                            className={`
                              w-14 mx-auto rounded-xl border flex flex-col
                              items-center justify-center py-1.5 gap-1
                              transition-colors duration-300
                              ${cellBg}
                              ${isCurrent ? 'ring-1 ring-white/10' : ''}
                            `}
                          >
                            {/* Número de página */}
                            <span className={`font-black text-sm leading-none ${valueColor}`}>
                              {isEmpty ? '–' : frame.page}
                            </span>
                            {/* Badges R y M */}
                            {!isEmpty && (
                              <div className="flex gap-0.5">
                                <motion.span
                                  key={`R-${frameIdx}-${col}-${frame.bitR?1:0}`}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.25 }}
                                  className={`
                                    text-[9px] font-black font-mono px-1 py-0.5 rounded
                                    border transition-colors duration-300
                                    ${frame.bitR
                                      ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                                      : 'bg-slate-700/60 border-slate-600/40 text-slate-500'}
                                  `}
                                >
                                  R={frame.bitR ? 1 : 0}
                                </motion.span>
                                <motion.span
                                  key={`M-${frameIdx}-${col}-${frame.bitM?1:0}`}
                                  animate={{ opacity: 1 }}
                                  transition={{ duration: 0.25 }}
                                  className={`
                                    text-[9px] font-black font-mono px-1 py-0.5 rounded
                                    border transition-colors duration-300
                                    ${frame.bitM
                                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                                      : 'bg-slate-700/60 border-slate-600/40 text-slate-500'}
                                  `}
                                >
                                  M={frame.bitM ? 1 : 0}
                                </motion.span>
                              </div>
                            )}
                            {/* Clase NRU */}
                            {!isEmpty && (
                              <span className={`text-[9px] font-bold ${classColors[nruClass]}`}>
                                C{nruClass}
                              </span>
                            )}
                          </motion.div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={col}
                        onClick={() => goToStep(col)}
                        className={`py-1 px-0.5 cursor-pointer transition-colors duration-100
                          ${isCurrent ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                      >
                        <motion.div
                          key={`${frameIdx}-${col}-${frame.page}`}
                          initial={frame.isNew || frame.isReplaced ? { scale: 0.65, opacity: 0 } : false}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                          className={`
                            w-10 h-10 mx-auto rounded-xl border flex flex-col
                            items-center justify-center gap-px
                            transition-colors duration-150
                            ${cellBg}
                            ${isCurrent ? 'ring-1 ring-white/10' : ''}
                          `}
                        >
                          <span className={`font-black text-sm leading-none ${valueColor}`}>
                            {isEmpty ? '–' : frame.page}
                          </span>
                          {subInfo}
                        </motion.div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Separador */}
              <tr>
                <td colSpan={snapshots.length + 1} className="pt-2 pb-1">
                  <div className="h-px bg-slate-700/40" />
                </td>
              </tr>

              {/* ── Fila de fallos ── */}
              <tr>
                <td className="sticky left-0 z-20 bg-slate-900 pr-4 py-2">
                  <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap">
                    Fallo de pág.
                  </span>
                </td>
                {snapshots.map((snap, col) => {
                  const isCurrent = col === currentStep;
                  return (
                    <td key={col}
                      onClick={() => goToStep(col)}
                      className={`py-2 px-0.5 text-center cursor-pointer
                        ${isCurrent ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'}`}
                    >
                      {snap.isFault
                        ? <span className={`
                            block mx-auto w-4 h-4 rounded-full bg-red-500
                            ${isCurrent ? 'ring-2 ring-red-400/50 ring-offset-1 ring-offset-slate-900' : ''}
                          `} />
                        : <span className="block mx-auto w-4 h-4" />
                      }
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Barra de progreso segmentada ── */}
      <div className="px-5 pb-5 pt-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2">
          <span>
            Fallos: <span className={`font-bold ${accentText}`}>{currentSnap.cumulativeFaults}</span>
          </span>
          <span>
            Hits: <span className="font-bold text-blue-400">{currentSnap.cumulativeHits}</span>
          </span>
          <span>
            Paso <span className="font-bold text-slate-300">{currentStep + 1}</span>/{snapshots.length}
          </span>
        </div>
        <div className="flex gap-px h-1.5 rounded-full overflow-hidden">
          {snapshots.map((snap, i) => (
            <div
              key={i}
              onClick={() => goToStep(i)}
              className={`flex-1 cursor-pointer transition-colors ${
                i > currentStep
                  ? 'bg-slate-700/50'
                  : snap.isFault
                    ? 'bg-red-500'
                    : 'bg-blue-600'
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-700 mt-1">
          <span>Inicio</span>
          <span>Fin</span>
        </div>
      </div>
    </div>
  );
}
