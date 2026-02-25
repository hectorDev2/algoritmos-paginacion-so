import { useSimulator } from '../store/simulatorStore';
import { runOPT } from '../algorithms';

export function StatsPanel() {
  const { state } = useSimulator();

  if (!state.isConfigured || state.snapshots.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-700/60 min-h-24 flex items-center justify-center p-6">
        <p className="text-slate-600 text-sm">Las estadísticas aparecerán aquí</p>
      </div>
    );
  }

  const snap        = state.snapshots[state.currentStep];
  const totalSteps  = state.snapshots.length;
  const curSteps    = state.currentStep + 1;

  // Métricas al paso actual
  const faults     = snap.cumulativeFaults;
  const hits       = snap.cumulativeHits;
  const faultRate  = (faults / curSteps) * 100;
  const hitRate    = (hits   / curSteps) * 100;

  // Métricas finales (toda la secuencia)
  const lastSnap    = state.snapshots[totalSteps - 1];
  const totalFaults = lastSnap.cumulativeFaults;
  const totalHits   = lastSnap.cumulativeHits;

  // ── Piso teórico: mínimo de fallos posibles ──────────────────────────────
  // Son las páginas únicas en la secuencia, acotado al nº de frames.
  // Con frameCount marcos, el mínimo absoluto de fallos = páginas únicas
  // (cada página debe cargarse al menos una vez).
  const uniquePages   = new Set(state.pageSequence).size;
  const minFaults     = uniquePages; // piso absoluto (carga inicial inevitable)

  // ── OPT como referencia óptima real ──────────────────────────────────────
  const optSnapshots  = state.algorithm !== 'OPT'
    ? runOPT(state.pageSequence, state.frameCount)
    : state.snapshots;
  const optFaults     = optSnapshots[optSnapshots.length - 1].cumulativeFaults;

  // ── Eficiencia relativa a OPT ─────────────────────────────────────────────
  // Cuántos fallos extra generó este algoritmo vs. OPT.
  // Si el algoritmo ES OPT, eficiencia = 100%.
  // Fórmula: efficiency = optFaults / totalFaults  (entre 0 y 1)
  const effVsOpt = totalFaults > 0
    ? Math.min((optFaults / totalFaults) * 100, 100)
    : 100;

  // ── Tasa de fallos final (métrica canónica de SO) ─────────────────────────
  const totalFaultRate = (totalFaults / totalSteps) * 100;
  const totalHitRate   = (totalHits   / totalSteps) * 100;

  const isOPT = state.algorithm === 'OPT';

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden">

      <div className="px-5 py-4 border-b border-slate-700/60">
        <h2 className="text-sm font-semibold text-slate-200">Estadísticas</h2>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Contadores al paso actual ── */}
        <div>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Hasta el paso {curSteps}/{totalSteps}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatCard label="Fallos" value={faults} color="red" />
            <StatCard label="Hits"   value={hits}   color="blue" />
            <StatCard label="Pasos"  value={curSteps} color="slate" />
          </div>
        </div>

        {/* ── Barras dinámicas ── */}
        <div className="space-y-2">
          <PercentBar label="Tasa de fallos" percent={faultRate} color="bg-red-500" />
          <PercentBar label="Tasa de hits"   percent={hitRate}   color="bg-blue-500" />
        </div>

        {/* ── Resumen total ── */}
        <div className="border-t border-slate-700/60 pt-4 space-y-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
            Resumen total — {totalSteps} referencias
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-red-400 font-black text-2xl">{totalFaults}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Fallos totales</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-3 text-center">
              <p className="text-blue-400 font-black text-2xl">{totalHits}</p>
              <p className="text-slate-500 text-[11px] mt-0.5">Hits totales</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <PercentBar label="Tasa de fallos (total)" percent={totalFaultRate} color="bg-red-500" />
            <PercentBar label="Tasa de hits (total)"   percent={totalHitRate}   color="bg-blue-500" />
          </div>

          {/* Referencia vs piso teórico */}
          <div className="bg-slate-800 rounded-xl p-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Páginas únicas en secuencia</span>
              <span className="font-mono font-bold text-slate-300">{uniquePages}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Fallos inevitables (mínimo)</span>
              <span className="font-mono font-bold text-slate-300">{minFaults}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Fallos OPT (referencia)</span>
              <span className="font-mono font-bold text-green-400">{optFaults}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Fallos este algoritmo</span>
              <span className={`font-mono font-bold ${isOPT ? 'text-green-400' : 'text-red-400'}`}>{totalFaults}</span>
            </div>
          </div>

          {/* Eficiencia relativa a OPT */}
          <div className="bg-slate-800 rounded-xl p-4 text-center">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-1">
              Eficiencia vs OPT
            </p>
            <p className={`font-black text-3xl ${
              effVsOpt >= 90 ? 'text-green-400' :
              effVsOpt >= 70 ? 'text-yellow-400' :
              effVsOpt >= 50 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {effVsOpt.toFixed(1)}%
            </p>
            <p className="text-[11px] text-slate-600 mt-1">
              {isOPT
                ? 'Este ES el algoritmo óptimo (Belady)'
                : `OPT usa ${optFaults} fallos · tú usas ${totalFaults}`}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    red:   'text-red-400 bg-red-950 border-red-800',
    blue:  'text-blue-400 bg-blue-950 border-blue-800',
    slate: 'text-slate-300 bg-slate-900 border-slate-700',
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colorMap[color]}`}>
      <p className="font-black text-2xl">{value}</p>
      <p className="text-xs opacity-70 mt-0.5">{label}</p>
    </div>
  );
}

function PercentBar({ label, percent, color }: { label: string; percent: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span>{percent.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-slate-900 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
