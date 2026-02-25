import { SimulatorProvider } from './store/simulatorStore';
import { ConfigPanel } from './components/ConfigPanel';
import { FrameTable } from './components/FrameTable';
import { StepControls } from './components/StepControls';
import { VariablesPanel } from './components/VariablesPanel';
import { StatsPanel } from './components/StatsPanel';

function AppContent() {
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
            {[
              ['FIFO',  'bg-blue-500/20 text-blue-300 ring-blue-500/30'],
              ['LRU',   'bg-purple-500/20 text-purple-300 ring-purple-500/30'],
              ['NRU',   'bg-yellow-500/20 text-yellow-300 ring-yellow-500/30'],
              ['OPT',   'bg-green-500/20 text-green-300 ring-green-500/30'],
              ['Clock', 'bg-orange-500/20 text-orange-300 ring-orange-500/30'],
              ['LFU',   'bg-pink-500/20 text-pink-300 ring-pink-500/30'],
            ].map(([label, cls]) => (
              <span key={label} className={`text-[11px] font-bold px-2.5 py-1 rounded-full ring-1 ${cls}`}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Layout principal ── */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 sm:px-6 py-6
                       grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-5 items-start">

        {/* Sidebar izquierdo */}
        <aside className="flex flex-col gap-5">
          <ConfigPanel />
          <StatsPanel />
        </aside>

        {/* Área principal */}
        <section className="flex flex-col gap-5 min-w-0">
          <FrameTable />
          <StepControls />
          <VariablesPanel />
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
