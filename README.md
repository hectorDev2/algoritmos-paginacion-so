# Simulador de Algoritmos de Reemplazo de Páginas

Simulador interactivo paso a paso de los algoritmos de reemplazo de páginas vistos en el curso de **Sistemas Operativos** (Ingeniería Informática).

Permite visualizar en tiempo real cómo cada algoritmo decide qué página desalojar, navegar libremente entre pasos, y comparar la eficiencia de cada algoritmo frente al óptimo teórico (OPT/Belady).

---

## Algoritmos implementados

| Algoritmo | Color | Descripción |
|---|---|---|
| **FIFO** | Azul | Reemplaza la página que lleva más tiempo en memoria |
| **LRU** | Púrpura | Reemplaza la página menos recientemente usada |
| **NRU** | Amarillo | Reemplaza por clase de bits R y M (Not Recently Used) |
| **OPT** | Verde | Óptimo de Belady — reemplaza la de uso más lejano en el futuro |
| **Clock** | Naranja | Segunda oportunidad — variante eficiente de FIFO con bit de referencia |
| **LFU** | Rosa | Reemplaza la página con menor frecuencia de acceso |

---

## Funcionalidades

- **Tabla de marcos interactiva** — filas = marcos, columnas = pasos de tiempo; clic en cualquier columna para saltar a ese paso
- **Navegación completa** — paso anterior/siguiente, ir al inicio/fin, reproducción automática con velocidades 0.5×, 1×, 2×, 4×
- **Variables internas por algoritmo** — visualización en tiempo real de la cola FIFO, timestamps LRU, bits R/M en NRU, próximo uso en OPT, puntero y bits del Clock, frecuencias LFU
- **Bit M editable en NRU** — clic en el badge `M=0/M=1` de cada columna para forzar el valor del bit de modificación; la simulación se recalcula al instante
- **Estadísticas reales de SO** — tasa de fallos, tasa de hits, fallos mínimos inevitables, fallos OPT como referencia, y eficiencia relativa al óptimo (`optFaults / tusFallos × 100%`)
- **Sub-información en celdas** — cada celda muestra datos internos del algoritmo activo (orden de llegada FIFO, timestamp LRU, bits R/M en NRU, bit de clock, frecuencia LFU)
- **Desempate OPT con FIFO** — cuando varias páginas tienen el mismo próximo uso (o nunca se usan), se reemplaza la que llegó primero a memoria

---

## Stack tecnológico

- **React 19** + **TypeScript**
- **Vite** con `@tailwindcss/vite` (Tailwind CSS v4)
- **Framer Motion** — animaciones de entrada de celdas
- **Vercel Analytics**

---

## Arquitectura

Todos los snapshots se pre-calculan al ejecutar la simulación. La navegación solo mueve un índice — esto permite retroceder libremente sin recalcular.

```
src/
├── types/index.ts           # Tipos: FrameState, Snapshot, AlgorithmVariables, SimulatorState
├── algorithms/
│   ├── fifo.ts
│   ├── lru.ts
│   ├── nru.ts               # Acepta dirtyOverrides para bit M manual por paso
│   ├── opt.ts               # Desempate por FIFO (arrivalOrder)
│   ├── clock.ts
│   ├── lfu.ts               # Desempate por LRU
│   └── utils.ts
├── store/simulatorStore.tsx # useReducer + Context + autoplay + TOGGLE_DIRTY
└── components/
    ├── ConfigPanel.tsx      # Selector de algoritmo, secuencia, nº de marcos, ejecutar/reiniciar
    ├── FrameTable.tsx       # Tabla principal con badges M clickeables en NRU
    ├── StepControls.tsx     # Navegación, scrubber, velocidad
    ├── VariablesPanel.tsx   # Variables internas por algoritmo
    └── StatsPanel.tsx       # Estadísticas con eficiencia vs OPT
```

---

## Instalación y uso

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador.

```bash
npm run build   # build de producción
```

---

## Notas sobre NRU

- El bit **R** se resetea automáticamente cada 4 pasos (`RESET_INTERVAL = 4`)
- El bit **M** se asigna con una seed determinística por número de página, pero puede sobreescribirse manualmente haciendo clic en el badge `M=0/M=1` de cada columna en la tabla
- Las clases NRU son: **C0** (R=0,M=0), **C1** (R=0,M=1), **C2** (R=1,M=0), **C3** (R=1,M=1)
- Se reemplaza la página de la clase más baja disponible

---

## Eficiencia del algoritmo

La eficiencia se calcula como:

```
Eficiencia = (Fallos OPT / Fallos algoritmo) × 100%
```

Donde **OPT** (Belady) es el óptimo teórico para esa misma secuencia y número de marcos. Si el algoritmo seleccionado es OPT, la eficiencia es siempre 100%.
