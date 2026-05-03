# ADR-001: SolidJS as Frontend Framework

**Status**: Accepted

## Context | 背景

CamForge requires a frontend framework for its desktop (Tauri) and web (Axum) interfaces. The application is canvas-heavy: three chart canvases (motion curves, pressure angle, curvature radius), one SVG cam animation viewport, and frequent data updates driven by parameter changes. Evaluated options:

1. **React** — Industry standard, largest ecosystem, but virtual DOM diffing adds overhead for frequent canvas redraws.
2. **Vue** — Good reactivity, but virtual DOM still present; smaller ecosystem than React for niche integrations.
3. **SolidJS** — Fine-grained reactivity without virtual DOM, compiles to real DOM updates, smaller bundle size.

## Decision | 决策

Use SolidJS as the frontend framework.

## Consequences | 后果

**Positive:**

- No virtual DOM overhead. SolidJS signals update only the exact DOM nodes that change, which is critical when simulation parameters change and only specific canvas regions need redrawing.
- Smaller bundle (~7KB core vs React ~40KB). Reduces Tauri app binary size and web initial load time.
- Fine-grained reactivity maps naturally to the parameter-driven simulation workflow: `params` signal change triggers `runSimulation()`, which updates `simulationData` signal, which auto-updates all chart canvases.
- JSX syntax is familiar to React developers, lowering onboarding friction.

**Negative:**

- Smaller ecosystem than React. Fewer off-the-shelf component libraries; the project uses `@kobalte/core` for accessible primitives.
- Fewer SolidJS-specific learning resources. Team members may need time to internalize the mental model (no hooks lifecycle, signals are not useState).
- Some React-ecosystem tools (e.g., Remotion for splash screen) require React interop, adding a small amount of React dependency.

**Neutral:**

- SolidJS `createSignal` pattern drives the store architecture (`simulation.ts`, `settings.ts`, `history.ts`). This is a different paradigm from Redux/Zustand but well-suited for this application's reactive data flow.
