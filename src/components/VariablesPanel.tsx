import { useSimulator } from '../store/simulatorStore';
import type {
  AlgorithmVariables, FIFOVariables, LRUVariables,
  NRUVariables, OPTVariables, CLOCKVariables, LFUVariables, MFUVariables,
} from '../types';

export function VariablesPanel() {
  const { state } = useSimulator();

  if (!state.isConfigured || state.snapshots.length === 0) {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-700/60 p-6
                      flex items-center justify-center min-h-28">
        <p className="text-slate-600 text-sm">
          Las variables del algoritmo se mostrarán aquí
        </p>
      </div>
    );
  }

  const snap = state.snapshots[state.currentStep];

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700/60 shadow-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700/60">
        <h2 className="text-sm font-semibold text-slate-200">
          Variables internas — {state.algorithm}
        </h2>
      </div>
      <div className="p-5">
        <VariablesContent vars={snap.variables} />
      </div>
    </div>
  );
}

function VariablesContent({ vars }: { vars: AlgorithmVariables }) {
  switch (vars.type) {
    case 'FIFO':  return <FIFOVars  vars={vars} />;
    case 'LRU':   return <LRUVars   vars={vars} />;
    case 'NRU':   return <NRUVars   vars={vars} />;
    case 'OPT':   return <OPTVars   vars={vars} />;
    case 'CLOCK': return <CLOCKVars vars={vars} />;
    case 'LFU':   return <LFUVars   vars={vars} />;
    case 'MFU':   return <MFUVars   vars={vars} />;
  }
}

// ── Subcomponentes por algoritmo ────────────────────────────────────────────

function FIFOVars({ vars }: { vars: FIFOVariables }) {
  return (
    <div className="space-y-4">
      <KV label="Puntero FIFO" value={`Frame ${vars.pointer}`} color="blue" />
      <div>
        <SectionLabel>Cola de llegada (primero = próximo reemplazo)</SectionLabel>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {vars.queue.length === 0
            ? <EmptyMsg>Vacía</EmptyMsg>
            : vars.queue.map((p, i) => (
              <ChipBlue key={i}>{p}</ChipBlue>
            ))}
        </div>
      </div>
      <Explainer>
        FIFO reemplaza la página que lleva más tiempo en memoria, sin importar cuántas veces fue usada.
      </Explainer>
    </div>
  );
}

function LRUVars({ vars }: { vars: LRUVariables }) {
  const minT = Math.min(...vars.timestamps.filter(t => t.page !== null).map(t => t.lastUsed));
  const maxT = Math.max(...vars.timestamps.map(t => t.lastUsed), 1);

  return (
    <div className="space-y-4">
      <SectionLabel>Timestamp de último uso por frame</SectionLabel>
      <div className="space-y-2">
        {vars.timestamps.map((t, i) => {
          const isLRU = t.page !== null && t.lastUsed === minT;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <span className="text-[11px] text-slate-500 w-16 shrink-0">Frame {i}</span>
              <span className="text-xs font-bold font-mono text-purple-300 w-14 shrink-0">
                {t.page !== null ? `Pág. ${t.page}` : '—'}
              </span>
              <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: t.page !== null ? `${(t.lastUsed / maxT) * 100}%` : '0%' }}
                />
              </div>
              <span className="text-[11px] font-mono text-purple-400 w-8 text-right shrink-0">
                t={t.lastUsed}
              </span>
              {isLRU && <Badge color="red">LRU</Badge>}
            </div>
          );
        })}
      </div>
      <Explainer>
        Se reemplaza el frame con el timestamp más pequeño (menos recientemente usado).
      </Explainer>
    </div>
  );
}

function NRUVars({ vars }: { vars: NRUVariables }) {
  const classBg = [
    'bg-green-500/10 border-green-500/30 text-green-300',
    'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
    'bg-orange-500/10 border-orange-500/30 text-orange-300',
    'bg-red-500/10 border-red-500/30 text-red-300',
  ];
  const classLabel = ['C0: R=0,M=0', 'C1: R=0,M=1', 'C2: R=1,M=0', 'C3: R=1,M=1'];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <KV label="Reseteos de bit R" value={`${vars.tickCount} veces`} color="yellow" />
        {vars.selectedClass !== null && (
          <KV label="Clase víctima" value={classLabel[vars.selectedClass]} color="red" />
        )}
      </div>

      <div>
        <SectionLabel>Estado de bits por frame</SectionLabel>
        <div className="mt-2 space-y-1.5">
          {vars.frames.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 w-16 shrink-0">Frame {i}</span>
              <span className="text-xs font-bold font-mono text-yellow-300 w-14 shrink-0">
                {f.page !== null ? `Pág. ${f.page}` : '—'}
              </span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded border font-mono font-bold
                ${f.bitR ? 'bg-yellow-500/10 border-yellow-500/40 text-yellow-300' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                R={f.bitR ? 1 : 0}
              </span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded border font-mono font-bold
                ${f.bitM ? 'bg-orange-500/10 border-orange-500/40 text-orange-300' : 'bg-slate-800 border-slate-700 text-slate-600'}`}>
                M={f.bitM ? 1 : 0}
              </span>
              {f.page !== null && (
                <span className={`text-[11px] px-1.5 py-0.5 rounded border font-bold ${classBg[f.class]}`}>
                  C{f.class}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <Explainer>
        NRU selecciona la clase más baja disponible (C0 &gt; C1 &gt; C2 &gt; C3) y reemplaza un frame de esa clase.
        El bit R se resetea periódicamente.
      </Explainer>
    </div>
  );
}

function OPTVars({ vars }: { vars: OPTVariables }) {
  return (
    <div className="space-y-4">
      <SectionLabel>Próximo uso de cada página en memoria</SectionLabel>
      <div className="space-y-1.5">
        {vars.nextUse.map((n, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="text-[11px] text-slate-500 w-16 shrink-0">Frame {i}</span>
            <span className="text-xs font-bold font-mono text-green-300 w-14 shrink-0">
              {n.page !== null ? `Pág. ${n.page}` : '—'}
            </span>
            <span className={`text-xs font-mono font-bold flex-1
              ${n.nextAt === 'Nunca' ? 'text-red-400' : 'text-green-300'}`}>
              {n.nextAt}
            </span>
            {n.nextAt === 'Nunca' && <Badge color="red">Víctima</Badge>}
          </div>
        ))}
      </div>
      <Explainer>
        OPT reemplaza la página cuyo próximo uso sea el más lejano (o que no se usará más).
        Es teóricamente óptimo pero requiere conocimiento del futuro.
      </Explainer>
    </div>
  );
}

function CLOCKVars({ vars }: { vars: CLOCKVariables }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <KV label="Puntero del reloj" value={`Frame ${vars.pointer}`} color="orange" />
        {vars.stepsToReplace > 0 && (
          <KV label="Frames recorridos" value={String(vars.stepsToReplace)} color="red" />
        )}
      </div>

      <div>
        <SectionLabel>Bit de segunda oportunidad por frame</SectionLabel>
        <div className="mt-2 flex flex-wrap gap-2">
          {vars.frames.map((f, i) => {
            const isPointer = vars.pointer === i;
            return (
              <div key={i} className={`
                rounded-xl border p-3 text-center min-w-[68px] transition-colors
                ${f.secondChanceBit
                  ? 'bg-orange-500/10 border-orange-500/40'
                  : 'bg-slate-800 border-slate-700/60'}
                ${isPointer ? 'ring-2 ring-white/20' : ''}
              `}>
                <p className="text-[10px] text-slate-500 mb-1">Frame {i}</p>
                <p className="font-black text-sm text-orange-200">{f.page !== null ? f.page : '—'}</p>
                <p className={`text-[10px] font-mono mt-1 font-bold
                  ${f.secondChanceBit ? 'text-orange-400' : 'text-slate-600'}`}>
                  bit={f.secondChanceBit ? '1' : '0'}
                </p>
                {isPointer && <p className="text-orange-300 text-xs mt-0.5">▼</p>}
              </div>
            );
          })}
        </div>
      </div>
      <Explainer>
        El puntero recorre los frames en círculo. Si bit=1 lo resetea (segunda oportunidad).
        Si bit=0 reemplaza ese frame.
      </Explainer>
    </div>
  );
}

function LFUVars({ vars }: { vars: LFUVariables }) {
  const maxFreq = Math.max(...vars.frequencies.map(f => f.freq), 1);
  const minFreq = Math.min(...vars.frequencies.filter(f => f.page !== null).map(f => f.freq), Infinity);

  return (
    <div className="space-y-4">
      <SectionLabel>Frecuencia de uso por frame</SectionLabel>
      <div className="space-y-2">
        {vars.frequencies.map((f, i) => {
          const isVictim = f.page !== null && f.freq === minFreq;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <span className="text-[11px] text-slate-500 w-16 shrink-0">Frame {i}</span>
              <span className="text-xs font-bold font-mono text-pink-300 w-14 shrink-0">
                {f.page !== null ? `Pág. ${f.page}` : '—'}
              </span>
              <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-pink-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                  style={{ width: f.page !== null ? `${(f.freq / maxFreq) * 100}%` : '0%', minWidth: f.page !== null && f.freq > 0 ? '20px' : '0' }}
                >
                  {f.page !== null && f.freq > 0 && (
                    <span className="text-[10px] text-white font-bold">{f.freq}</span>
                  )}
                </div>
              </div>
              {isVictim && <Badge color="red">Víctima</Badge>}
            </div>
          );
        })}
      </div>
      <Explainer>
        LFU reemplaza el frame con menor frecuencia de acceso. En caso de empate se usa LRU como desempate.
      </Explainer>
    </div>
  );
}

function MFUVars({ vars }: { vars: MFUVariables }) {
  const maxFreq = Math.max(...vars.frequencies.filter(f => f.page !== null).map(f => f.freq), 1);
  const victim = vars.frequencies
    .filter(f => f.page !== null)
    .reduce<{ freq: number } | null>((acc, f) => {
      if (!acc || f.freq > acc.freq) return f;
      return acc;
    }, null);
  const victimFreq = victim?.freq ?? -1;

  return (
    <div className="space-y-4">
      <SectionLabel>Frecuencia de uso por frame</SectionLabel>
      <div className="space-y-2">
        {vars.frequencies.map((f, i) => {
          const isVictim = f.page !== null && f.freq === victimFreq;
          return (
            <div key={i} className="flex items-center gap-2.5">
              <span className="text-[11px] text-slate-500 w-16 shrink-0">Frame {i}</span>
              <span className="text-xs font-bold font-mono text-teal-300 w-14 shrink-0">
                {f.page !== null ? `Pág. ${f.page}` : '—'}
              </span>
              <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-teal-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-1.5"
                  style={{ width: f.page !== null ? `${(f.freq / maxFreq) * 100}%` : '0%', minWidth: f.page !== null && f.freq > 0 ? '20px' : '0' }}
                >
                  {f.page !== null && f.freq > 0 && (
                    <span className="text-[10px] text-white font-bold">{f.freq}</span>
                  )}
                </div>
              </div>
              {isVictim && <Badge color="red">Víctima</Badge>}
            </div>
          );
        })}
      </div>
      <Explainer>
        MFU reemplaza el frame con mayor frecuencia de acceso (más frecuentemente usado). En caso de empate se usa LRU como desempate.
      </Explainer>
    </div>
  );
}

// ── Primitivos de UI ────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
      {children}
    </p>
  );
}

function KV({ label, value, color }: { label: string; value: string; color: string }) {
  const map: Record<string, string> = {
    blue:   'text-blue-300 bg-blue-500/10 border-blue-500/30',
    purple: 'text-purple-300 bg-purple-500/10 border-purple-500/30',
    yellow: 'text-yellow-300 bg-yellow-500/10 border-yellow-500/30',
    green:  'text-green-300 bg-green-500/10 border-green-500/30',
    orange: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
    red:    'text-red-300 bg-red-500/10 border-red-500/30',
    pink:   'text-pink-300 bg-pink-500/10 border-pink-500/30',
  };
  return (
    <div className="flex items-center justify-between gap-4 py-2 px-3
                    bg-slate-800 rounded-xl border border-slate-700/60">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${map[color] ?? map.blue}`}>
        {value}
      </span>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: 'red' | 'green' | 'blue' }) {
  const map = {
    red:   'bg-red-500/10 border-red-500/30 text-red-400',
    green: 'bg-green-500/10 border-green-500/30 text-green-400',
    blue:  'bg-blue-500/10 border-blue-500/30 text-blue-400',
  };
  return (
    <span className={`shrink-0 text-[10px] font-bold border rounded-md px-1.5 py-0.5 ${map[color]}`}>
      {children}
    </span>
  );
}

function ChipBlue({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-blue-500/10 border border-blue-500/30 text-blue-300
                     rounded-lg px-2.5 py-1 text-sm font-mono font-bold">
      {children}
    </span>
  );
}

function EmptyMsg({ children }: { children: React.ReactNode }) {
  return <span className="text-slate-600 text-sm">{children}</span>;
}

function Explainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/40">
      <p className="text-xs text-slate-500 leading-relaxed">{children}</p>
    </div>
  );
}
