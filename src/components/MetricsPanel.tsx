import { useSimulator } from '../store/simulatorStore';
import type { AlgorithmId } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function MetricRow({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1.5 border-b border-slate-700/40 last:border-0">
      <span className="text-slate-400 text-xs leading-tight">{label}</span>
      <span className="text-slate-100 text-xs font-mono font-semibold shrink-0">
        {value}
        {sub && <span className="text-slate-500 font-normal ml-1">{sub}</span>}
      </span>
    </div>
  );
}

function SectionCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border bg-slate-900/60 overflow-hidden`} style={{ borderColor: color + '33' }}>
      <div className="px-4 py-2.5 border-b" style={{ borderColor: color + '33', background: color + '11' }}>
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color }}>{title}</h3>
      </div>
      <div className="px-4 py-1">{children}</div>
    </div>
  );
}

function extraInterruptLabel(algorithm: AlgorithmId): string {
  switch (algorithm) {
    case 'CLOCK': return 'Pasos buscando víctima (clock hand)';
    case 'NRU':   return 'Resets de bit R (ticks de reloj NRU)';
    default:      return 'Interrupciones extra del algoritmo';
  }
}

// ─── Componente principal ──────────────────────────────────────────────────────

export function MetricsPanel() {
  const { state } = useSimulator();
  const { metrics, algorithm, isConfigured } = state;

  if (!isConfigured || !metrics) {
    return (
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-5 py-8 text-center text-slate-500 text-xs">
        Ejecuta la simulación para ver las métricas detalladas.
      </div>
    );
  }

  const m = metrics;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-slate-200 tracking-wide">Métricas del Simulador</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* ── Recursos ── */}
        <SectionCard title="Recursos Utilizados" color="#6366f1">
          <MetricRow label="Frames asignados" value={m.framesAllocated} sub="frames" />
          <MetricRow label="Páginas únicas" value={m.uniquePagesTotal} sub="páginas" />
          <MetricRow label="Pico de frames ocupados" value={m.peakFramesOccupied} sub="frames" />
          <MetricRow label="Reemplazos realizados" value={m.pagesEvicted} sub="páginas eviccionadas" />
          <MetricRow label="Memoria simulada" value={m.memorySimulatedKB} sub="KB" />
        </SectionCard>

        {/* ── Tiempo de ejecución ── */}
        <SectionCard title="Tiempo de Ejecución" color="#22d3ee">
          <MetricRow label="Tiempo de cómputo" value={m.executionTimeMs.toFixed(3)} sub="ms" />
          <MetricRow
            label="Rendimiento"
            value={m.referencesPerMs > 0 ? m.referencesPerMs.toFixed(1) : '—'}
            sub={m.referencesPerMs > 0 ? 'refs/ms' : ''}
          />
          <MetricRow label="Referencias totales" value={m.totalSteps} sub="pasos" />
          <MetricRow label="Fallos de página" value={m.totalFaults} sub={`(${((m.totalFaults / m.totalSteps) * 100).toFixed(1)}%)`} />
          <MetricRow label="Aciertos" value={m.totalHits} sub={`(${((m.totalHits / m.totalSteps) * 100).toFixed(1)}%)`} />
        </SectionCard>

        {/* ── Llamadas al sistema ── */}
        <SectionCard title="Llamadas al Sistema" color="#f59e0b">
          <MetricRow label="Syscalls totales" value={m.totalSyscalls} />
          <MetricRow label="Lecturas de disco" value={m.diskReads} />
          <div className="mt-2 mb-1.5 px-2 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300/80 leading-relaxed">
            Cada fallo de página genera una llamada al sistema operativo (trap) y una lectura de disco para cargar la página ausente.
          </div>
        </SectionCard>

        {/* ── Interrupciones ── */}
        <SectionCard title="Interrupciones" color="#a78bfa">
          <MetricRow label="Page fault interrupts" value={m.pageFaultInterrupts} />
          <MetricRow label={extraInterruptLabel(algorithm)} value={m.extraInterrupts} />
          <MetricRow label="Total interrupciones" value={m.totalInterrupts} />
          {(algorithm === 'CLOCK' || algorithm === 'NRU') && (
            <div className="mt-2 mb-1.5 px-2 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-300/80 leading-relaxed">
              {algorithm === 'CLOCK'
                ? 'CLOCK genera interrupciones adicionales cada vez que el puntero avanza revisando bits de segunda oportunidad.'
                : 'NRU genera interrupciones periódicas para resetear los bits R (simulando el tick del temporizador del SO).'}
            </div>
          )}
        </SectionCard>

      </div>
    </div>
  );
}
