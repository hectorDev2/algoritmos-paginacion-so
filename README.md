# Simulador de Algoritmos de Reemplazo de Páginas

Simulador interactivo paso a paso de los algoritmos de reemplazo de páginas del curso de **Sistemas Operativos** (Ingeniería Informática).

Permite visualizar en tiempo real cómo cada algoritmo decide qué página desalojar, navegar libremente entre pasos y comparar la eficiencia de cada algoritmo frente al óptimo teórico (OPT/Belady).

---

## Instalación

Requiere **Node.js 18+**.

```bash
# Clonar el repositorio
git clone https://github.com/hectorDev2/algoritmos-paginacion-so.git
cd algoritmos-paginacion-so

# Instalar dependencias
npm install
```

---

## Uso

```bash
# Modo desarrollo con hot-reload
npm run dev
```

Abre `http://localhost:5173` en el navegador.

```bash
# Build de producción
npm run build

# Previsualizar el build de producción localmente
npm run preview
```

---

## Flujo básico

1. **Configurar** — Ingresa la secuencia de páginas (ej. `1 2 3 4 1 2 5`) y el número de marcos.
2. **Elegir algoritmo** — Selecciona uno de los 7 algoritmos disponibles.
3. **Ejecutar** — Pulsa _Ejecutar simulación_. Los snapshots se pre-calculan al instante.
4. **Navegar** — Usa los controles para avanzar, retroceder, ir al inicio/fin o reproducir automáticamente.
5. **Analizar** — Observa la tabla de marcos, las variables internas del algoritmo, las estadísticas y el panel de métricas.

---

## Algoritmos implementados

### FIFO — First In, First Out

> Reemplaza la página que lleva **más tiempo** cargada en memoria.

Mantiene una cola circular. Cuando se produce un fallo y no hay frames libres, expulsa la página que entró primero (la que apunta `fifoPointer`). No tiene en cuenta si la página fue usada recientemente.

- **Ventaja**: muy simple de implementar.
- **Desventaja**: sufre la **Anomalía de Bélady** — añadir más frames puede aumentar los fallos.
- **Desempate**: no aplica (el puntero FIFO determina la víctima de forma determinista).
- **Variables visibles**: puntero FIFO y cola ordenada por llegada.

---

### LRU — Least Recently Used

> Reemplaza la página **menos recientemente usada**.

Cada frame lleva un `timestamp` que se actualiza en cada acceso (hit o carga). Al producirse un fallo, se expulsa el frame con el timestamp más antiguo.

- **Ventaja**: aproximación práctica al óptimo; respeta el principio de localidad temporal.
- **Desventaja**: requiere registrar el tiempo del último acceso por frame.
- **Desempate**: el timestamp más bajo gana (es único por paso).
- **Variables visibles**: timestamp de último uso de cada frame.

---

### NRU — Not Recently Used

> Reemplaza la página de **la clase más baja** según los bits R (Referenced) y M (Modified).

Cada frame tiene dos bits:
- **R** (Referenced): se activa al acceder a la página; se **resetea cada 4 pasos** (simulando el tick del temporizador del SO).
- **M** (Modified / Dirty): se activa si la página fue modificada.

Las cuatro clases de prioridad de reemplazo (de menor a mayor costo):

| Clase | R | M | Interpretación |
|-------|---|---|----------------|
| C0    | 0 | 0 | No usada, no modificada — candidata preferida |
| C1    | 0 | 1 | No usada, modificada |
| C2    | 1 | 0 | Usada, no modificada |
| C3    | 1 | 1 | Usada y modificada — última en ser reemplazada |

Se reemplaza la primera página de la clase más baja disponible.

- **Interactividad**: el bit M puede sobreescribirse manualmente haciendo clic en el badge `M=0/M=1` de cada columna en la tabla. La simulación se recalcula al instante.
- **Variables visibles**: bits R/M de cada frame, clase asignada y contador de resets (tickCount).

---

### OPT — Algoritmo Óptimo de Bélady

> Reemplaza la página cuyo **próximo uso sea más lejano en el futuro** (o que nunca se vuelva a usar).

Requiere conocer la secuencia completa de antemano, por lo que es **no implementable en la práctica**. Se usa como referencia teórica del mínimo de fallos posible para una secuencia y número de frames dados.

- **Ventaja**: garantiza el menor número de fallos posible.
- **Desventaja**: requiere conocimiento del futuro — imposible en un SO real.
- **Desempate**: si varias páginas tienen el mismo próximo uso (o ninguna se vuelve a usar), se reemplaza la que **llegó antes a memoria** (criterio FIFO sobre `arrivalOrder`).
- **Variables visibles**: próximo uso de cada página en memoria (`Paso N` o `Nunca`).

---

### Clock — Segunda Oportunidad

> Variante eficiente de FIFO que da a cada página **una segunda oportunidad** antes de reemplazarla.

Mantiene un puntero circular (`clockPointer`) sobre los frames. Cada frame tiene un **bit de reloj** (`clockBit`):
- Si la página es accedida (hit), su bit se pone a `1`.
- Al producirse un fallo, el puntero avanza:
  - Si el bit del frame actual es `1` → se pone a `0` (segunda oportunidad) y el puntero avanza.
  - Si el bit es `0` → esa página es reemplazada.

- **Ventaja**: más justo que FIFO puro; páginas usadas recentemente no son reemplazadas de inmediato.
- **Variables visibles**: posición del puntero, bit de reloj de cada frame y pasos recorridos buscando víctima (`stepsToReplace`).
- **Métrica extra**: `stepsToReplace` se acumula como interrupciones adicionales en el panel de métricas.

---

### LFU — Least Frequently Used

> Reemplaza la página con **menor frecuencia de acceso** acumulada.

Cada frame mantiene un contador `frequency` que se incrementa en cada hit. Al producirse un fallo, se expulsa el frame con el contador más bajo.

- **Ventaja**: páginas muy usadas permanecen en memoria.
- **Desventaja**: una página muy usada en el pasado pero ya innecesaria puede quedarse por su alto contador.
- **Desempate**: si dos frames tienen igual frecuencia, se expulsa el **menos recientemente usado** (LRU sobre `lastUsed`). Al cargar una página nueva, su frecuencia se inicializa en `1`.
- **Variables visibles**: frecuencia de acceso de cada frame.

---

### MFU — Most Frequently Used

> Reemplaza la página con **mayor frecuencia de acceso** acumulada.

Inverso a LFU. La hipótesis es que las páginas con alta frecuencia ya fueron suficientemente usadas y las que tienen poca frecuencia probablemente se necesitarán próximamente.

- **Ventaja**: útil en patrones donde las páginas de uso intensivo son temporales.
- **Desventaja**: en la mayoría de cargas reales produce más fallos que LFU.
- **Desempate**: si dos frames tienen igual frecuencia, se expulsa el **menos recientemente usado** (LRU sobre `lastUsed`). Al cargar una página nueva, su frecuencia se inicializa en `1`.
- **Variables visibles**: frecuencia de acceso de cada frame.

---

### Aging — Envejecimiento

> Aproxima LRU mediante un **contador de 8 bits por frame** que se desplaza a la derecha en cada paso.

En cada referencia a memoria:
1. **Envejecimiento**: el contador de **todos** los frames ocupados se incrementa en 1.
2. **Reset al acceder**: si la página referenciada ya estaba en memoria (hit) o se acaba de cargar, su contador se fija en **1** (recién usada).
3. **Reemplazo**: ante un fallo sin frames libres, se expulsa el frame con el **contador más alto** (el que lleva más pasos sin ser accedido).

- **Ventaja**: sencillo de entender e implementar; el valor del contador refleja directamente cuántos pasos lleva la página sin usarse.
- **Desventaja**: similar a LRU pero sin la precisión exacta del timestamp; dos páginas no usadas el mismo número de pasos son indistinguibles salvo por desempate.
- **Desempate**: si dos frames tienen igual contador, se expulsa el **menos recientemente usado** (menor `lastUsed`).
- **Variables visibles**: contador decimal por frame (1 = recién usada, N = N pasos sin acceso).

---

## Funcionalidades del simulador

### Tabla de marcos
- Filas = frames físicos, columnas = pasos de la secuencia.
- **Código de color** por celda: verde = carga nueva, azul = hit, rojo = reemplazo, gris = ocupada sin cambios.
- Clic en cualquier columna para saltar directamente a ese paso.
- Cada celda muestra datos internos según el algoritmo activo: orden de llegada (FIFO), timestamp (LRU), bits R/M y clase (NRU), bit de reloj (Clock), frecuencia (LFU/MFU).
- En NRU: badge `M=0` / `M=1` clickeable por columna para forzar el bit de modificación.

### Controles de navegación
- **Anterior / Siguiente** — avanzar o retroceder un paso.
- **Inicio / Fin** — saltar al primer o último paso.
- **Scrubber** — barra deslizante para saltar a cualquier paso directamente.
- **Reproducción automática** — velocidades 0.5×, 1×, 2×, 4× (500 ms, 1000 ms, 500 ms, 250 ms entre pasos).
- Se detiene automáticamente al llegar al último paso.

### Panel de variables
Muestra en tiempo real las estructuras internas del algoritmo en el paso actual:
- **FIFO**: cola ordenada por llegada y posición del puntero.
- **LRU**: timestamp de último uso por frame.
- **NRU**: bits R/M, clase y tick count de resets.
- **OPT**: próximo uso de cada página cargada.
- **Clock**: puntero, bit de segunda oportunidad y pasos recorridos.
- **LFU / MFU**: frecuencia de acceso por frame.
- **Aging**: contador de 8 bits en binario y decimal por frame.

### Panel de estadísticas
- Fallos y hits totales con porcentaje.
- Fallos OPT (mínimo teórico) para la misma secuencia y frames.
- Fallos mínimos inevitables (primeras cargas en frames vacíos).
- **Eficiencia** relativa al óptimo: `Fallos OPT / Fallos algoritmo × 100%`.

### Panel de métricas
Se calcula al ejecutar la simulación y se divide en 4 secciones:

| Sección | Métricas |
|---------|----------|
| **Recursos** | Frames asignados, páginas únicas, pico de frames ocupados, páginas eviccionadas, memoria simulada (frames × 4 KB) |
| **Tiempo de ejecución** | Ms reales de cómputo, rendimiento (refs/ms), total de pasos, fallos y hits con porcentaje |
| **Llamadas al sistema** | Syscalls totales y lecturas de disco (1 por cada fallo de página) |
| **Interrupciones** | Page fault interrupts + extras según algoritmo (Clock: suma de `stepsToReplace`; NRU: `tickCount`) |

---

## Arquitectura

Todos los snapshots se pre-calculan en el momento de ejecutar la simulación. La navegación únicamente mueve un índice entero — esto permite retroceder libremente sin necesidad de recalcular nada.

```
src/
├── types/index.ts                # Tipos globales
│   ├── FrameState                # Estado de un frame en un paso
│   ├── Snapshot                  # Estado completo de un paso
│   ├── AlgorithmVariables        # Union type de variables por algoritmo
│   ├── SimulatorState            # Estado global del store
│   ├── SimulatorAction           # Acciones del reducer
│   └── SimulationMetrics         # Métricas calculadas post-simulación
│
├── algorithms/
│   ├── fifo.ts    → runFIFO(sequence, frameCount)
│   ├── lru.ts     → runLRU(sequence, frameCount)
│   ├── nru.ts     → runNRU(sequence, frameCount, dirtyOverrides)
│   ├── opt.ts     → runOPT(sequence, frameCount)
│   ├── clock.ts   → runClock(sequence, frameCount)
│   ├── lfu.ts     → runLFU(sequence, frameCount)
│   ├── mfu.ts     → runMFU(sequence, frameCount)
│   ├── aging.ts   → runAging(sequence, frameCount)
│   ├── utils.ts   → emptyFrame(), cloneFrames()
│   └── index.ts   → re-exporta todas las funciones
│
├── store/
│   └── simulatorStore.tsx
│       ├── simulatorReducer      # Reducer principal (useReducer)
│       ├── computeSnapshots()    # Despacha al algoritmo correcto
│       ├── computeMetrics()      # Calcula SimulationMetrics post-ejecución
│       ├── SimulatorProvider     # Context Provider + autoplay effect
│       ├── useSimulator()        # Hook: accede a state + dispatch
│       └── useSimulatorActions() # Hook: acciones memoizadas con useCallback
│
└── components/
    ├── ConfigPanel.tsx    # Selector de algoritmo, secuencia, nº de frames, ejecutar/reiniciar
    ├── FrameTable.tsx     # Tabla principal; badges M clickeables en NRU
    ├── StepControls.tsx   # Navegación, scrubber, selector de velocidad
    ├── VariablesPanel.tsx # Variables internas del algoritmo en el paso actual
    ├── StatsPanel.tsx     # Estadísticas y eficiencia vs OPT
    └── MetricsPanel.tsx   # Métricas: recursos, tiempo, syscalls e interrupciones
```

### Flujo de datos

```
ConfigPanel
    └─► dispatch(RUN_SIMULATION)
            └─► computeSnapshots()  →  Snapshot[]
            └─► computeMetrics()    →  SimulationMetrics
                    └─► state.snapshots  ──► FrameTable
                    └─► state.metrics    ──► MetricsPanel
                    └─► state.currentStep ─► VariablesPanel
                                            StatsPanel
                                            StepControls
```

---

## Stack tecnológico

| Tecnología | Uso |
|---|---|
| **React 19** | UI declarativa + hooks |
| **TypeScript** | Tipado estático end-to-end |
| **Vite** | Dev server y bundler |
| **Tailwind CSS v4** | Estilos utilitarios (via `@tailwindcss/vite`) |
| **Framer Motion** | Animaciones de entrada en la tabla de marcos |
| **Vercel Analytics** | Métricas de uso en producción |

---

## Notas de implementación

### Anomalía de Bélady
Solo FIFO puede sufrirla. Pruébala con la secuencia clásica `1 2 3 4 1 2 5 1 2 3 4 5`:
- Con **3 frames**: 9 fallos.
- Con **4 frames**: 10 fallos (más frames, más fallos).

### Desempate en OPT
Cuando varias páginas en memoria tienen el mismo próximo uso (incluyendo `Infinity` si nunca se vuelven a usar), se aplica **FIFO** como criterio de desempate: se expulsa la que llegó primero a memoria (`arrivalOrder`). Esto hace el algoritmo determinista.

### Bit M en NRU
El bit de modificación se inicializa con una función hash determinista sobre el número de página (`(page * 1103515245 + 12345) & 0x7fffffff`). Puede sobreescribirse manualmente paso a paso desde la tabla. Cada override dispara un recálculo completo de la simulación.

### Eficiencia vs OPT
```
Eficiencia = (Fallos OPT / Fallos algoritmo) × 100%
```
Si el algoritmo seleccionado es OPT, la eficiencia es siempre 100%. Si hay 0 fallos en ambos, también se reporta 100%.

---

## Informe técnico

El directorio `informe/` contiene un informe académico completo en LaTeX (`informe.tex`) elaborado para la asignatura de Sistemas Operativos — UNSAAC.

**Contenido del informe:**
- Marco teórico: memoria virtual, paginación y fallos de página
- Explicación detallada de los 7 algoritmos con ejemplos trazados paso a paso
- Descripción de la arquitectura e implementación del simulador
- Capturas de pantalla anotadas de cada funcionalidad
- Análisis comparativo de resultados con la secuencia clásica de Bélady
- Panel de métricas: recursos, tiempo, syscalls e interrupciones
- Conclusiones y referencias bibliográficas

**Para compilar el PDF:**
```bash
cd informe
# Coloca logo.png de la UNSAAC en esta carpeta
pdflatex informe.tex
pdflatex informe.tex   # segunda pasada para índice y referencias cruzadas
```
