import { SimulatorProvider, useSimulator } from './store/simulatorStore';
import { ConfigPanel } from './components/ConfigPanel';
import { FrameTable } from './components/FrameTable';
import { StepControls } from './components/StepControls';
import { VariablesPanel } from './components/VariablesPanel';
import { StatsPanel } from './components/StatsPanel';
import { MetricsPanel } from './components/MetricsPanel';

function AppContent() {
  const { state } = useSimulator();
  const activeAlgo = state.algorithm;

  const ALGO_BADGES: { id: string; label: string; dim: string; bright: string }[] = [
    { id: 'FIFO',    label: 'FIFO',      dim: 'bg-blue-500/20   text-blue-300/50   ring-blue-500/20',   bright: 'bg-blue-500/30   text-blue-200 ring-blue-400/70   shadow-blue-500/40' },
    { id: 'LRU',     label: 'LRU',       dim: 'bg-purple-500/20 text-purple-300/50 ring-purple-500/20', bright: 'bg-purple-500/30 text-purple-200 ring-purple-400/70 shadow-purple-500/40' },
    { id: 'NRU',     label: 'NRU',       dim: 'bg-yellow-500/20 text-yellow-300/50 ring-yellow-500/20', bright: 'bg-yellow-500/30 text-yellow-200 ring-yellow-400/70 shadow-yellow-500/40' },
    { id: 'OPT',     label: 'OPT',       dim: 'bg-green-500/20  text-green-300/50  ring-green-500/20',  bright: 'bg-green-500/30  text-green-200  ring-green-400/70  shadow-green-500/40' },
    { id: 'CLOCK',   label: 'Clock',     dim: 'bg-orange-500/20 text-orange-300/50 ring-orange-500/20', bright: 'bg-orange-500/30 text-orange-200 ring-orange-400/70 shadow-orange-500/40' },
    { id: 'LFU',     label: 'LFU',       dim: 'bg-pink-500/20   text-pink-300/50   ring-pink-500/20',   bright: 'bg-pink-500/30   text-pink-200   ring-pink-400/70   shadow-pink-500/40' },
    { id: 'MFU',     label: 'MFU',       dim: 'bg-teal-500/20   text-teal-300/50   ring-teal-500/20',   bright: 'bg-teal-500/30   text-teal-200   ring-teal-400/70   shadow-teal-500/40' },
    { id: 'AGING',   label: 'Aging',     dim: 'bg-rose-500/20   text-rose-300/50   ring-rose-500/20',   bright: 'bg-rose-500/30   text-rose-200   ring-rose-400/70   shadow-rose-500/40' },
    { id: 'SEGUNDA', label: '2da Oport', dim: 'bg-cyan-500/20   text-cyan-300/50   ring-cyan-500/20',   bright: 'bg-cyan-500/30   text-cyan-200   ring-cyan-400/70   shadow-cyan-500/40' },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 flex flex-col">

      {/* ── Header ── */}
      <header className="shrink-0 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm font-black text-white">
              SO
            </div>
            <div>
              <span className="font-bold text-white text-sm">Simulador de Paginación</span>
              <span className="hidden sm:inline text-slate-500 text-xs ml-2">— Sistemas Operativos</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {ALGO_BADGES.map(({ id, label, dim, bright }) => {
              const isActive = activeAlgo === id;
              return (
                <span
                  key={id}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 transition-all duration-300
                    ${isActive ? `${bright} shadow-sm scale-105` : dim}`}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Layout principal ── */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6
                       grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 items-start">

        {/* Sidebar izquierdo — en mobile solo muestra ConfigPanel; StatsPanel va abajo */}
        <aside className="flex flex-col gap-5">
          <ConfigPanel />
          <div className="hidden xl:block">
            <StatsPanel />
          </div>
        </aside>

        {/* Área principal */}
        <section className="flex flex-col gap-5 min-w-0">
          <FrameTable />
          <StepControls />
          <VariablesPanel />
          <MetricsPanel />
          {/* StatsPanel al final en mobile */}
          <div className="xl:hidden">
            <StatsPanel />
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-slate-800/60 py-3 text-center text-xs text-slate-600">
        Simulador Interactivo de Algoritmos de Reemplazo de Páginas
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <SimulatorProvider>
      <AppContent />
    </SimulatorProvider>
  );
}
