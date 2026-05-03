# Testing Strategy | 测试策略

> This document defines the testing approach, coverage targets, tooling, and CI integration for CamForge.

## Test Pyramid | 测试金字塔

```
        ╱  E2E  ╲           Playwright (planned)
       ╱──────────╲         Critical user flows only
      ╱ Integration ╲       API routes, Tauri commands
     ╱────────────────╲     Cross-boundary tests
    ╱    Unit Tests     ╲   Pure functions, stores, utilities
   ╱──────────────────────╲ Largest volume, fastest execution
```

### Unit Tests | 单元测试

**Rust (`camforge-core`)**

- Scope: motion law computation, profile generation, geometry analysis, parameter validation
- Run: `cargo test -p camforge-core`
- Location: `#[cfg(test)] mod tests` blocks inline in each source file (`motion.rs`, `profile.rs`, `geometry.rs`, `types.rs`, `simulation.rs`)
- Tooling: `approx` crate for floating-point assertions (`assert_relative_eq!`)
- Current status: 5 test modules, covering core math functions

**Frontend (SolidJS/TypeScript)**

- Scope: utility functions, stores, exporters, API adapter, UI components
- Run: `pnpm test` (watch) / `pnpm test:run` (single run)
- Location: `src/**/__tests__/*.test.ts(x)`
- Tooling: Vitest 4 + jsdom + `@solidjs/testing-library`
- Config: `vitest.config.ts` — jsdom environment, globals enabled, excludes `src-tauri/` and `crates/`
- Current test files:
  - `src/utils/__tests__/array.test.ts` — array utilities
  - `src/utils/__tests__/chartDrawing.test.ts` — chart data validation
  - `src/utils/__tests__/debounce.test.ts` — async debounce
  - `src/utils/__tests__/platform.test.ts` — platform detection
  - `src/stores/__tests__/settings.test.ts` — settings store
  - `src/stores/__tests__/simulation.test.ts` — simulation store
  - `src/stores/__tests__/motion-laws.test.ts` — motion law definitions
  - `src/constants/__tests__/numeric.test.ts` — numeric constants
  - `src/components/__tests__/Select.test.tsx` — Select component
  - `src/components/__tests__/Toggle.test.tsx` — Toggle component
  - `src/components/__tests__/NumberInput.test.tsx` — NumberInput component
  - `src/components/__tests__/ErrorBoundary.test.tsx` — error boundary
  - `src/exporters/__tests__/exporters.test.ts` — DXF/CSV/Excel export
  - `src/api/__tests__/api.test.ts` — HTTP/Tauri API adapters

### Integration Tests | 集成测试

**Rust (`camforge-server`)**

- Scope: HTTP API endpoints — request parsing, response format, error handling
- Run: `cargo test -p camforge-server`
- Location: `crates/camforge-server/tests/integration.rs`
- Tooling: Axum test helpers, `reqwest` for HTTP calls

**Tauri Commands** (coverage gap — see Known Gaps)

- `src-tauri/src/commands/` currently has zero test coverage
- Target: add integration tests that exercise IPC command handlers through Tauri's test harness

### E2E Tests | 端到端测试

- Tool: **Playwright** (planned, not yet integrated)
- Scope: critical user flows
  - Set parameters -> run simulation -> view results
  - Change follower type -> verify chart updates
  - Export DXF/CSV/SVG -> verify file download
- Status: Not yet implemented (tracked in TODO.md Phase 5)

## Coverage Targets | 覆盖率目标

| Layer | Target | Current | Tool |
|-------|--------|---------|------|
| Rust (`camforge-core`) | 80% | ~60% (estimated) | `cargo-tarpaulin` or `cargo-llvm-cov` |
| Rust (`camforge-server`) | 60% | Low (1 integration test) | `cargo-tarpaulin` |
| Frontend TypeScript | 60% | ~30% (estimated, 14 test files / 65 source files) | `vitest --coverage` (c8/istanbul) |

### How to Measure | 如何测量

```bash
# Rust coverage
cargo install cargo-tarpaulin
cargo tarpaulin -p camforge-core --out Html --output-dir coverage/rust

# Frontend coverage
pnpm vitest run --coverage
# Reports generated in coverage/ directory
```

## Writing Tests | 编写测试

### Rust Test Conventions

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use approx::assert_relative_eq;

    #[test]
    fn compute_rise_cycloidal_at_midpoint() {
        let result = compute_rise(MotionLaw::Cycloidal, 0.5, 10.0, 1.0, std::f64::consts::PI);
        assert_relative_eq!(result[0], 5.0, max_relative = 1e-10);
    }
}
```

### Frontend Test Conventions

```typescript
import { render, fireEvent } from '@solidjs/testing-library';
import { describe, it, expect } from 'vitest';

describe('NumberInput', () => {
  it('calls onChange with parsed value', async () => {
    const onChange = vi.fn();
    const { getByRole } = render(() => <NumberInput value={5} onChange={onChange} />);
    const input = getByRole('spinbutton');
    fireEvent.input(input, { target: { value: '10' } });
    expect(onChange).toHaveBeenCalledWith(10);
  });
});
```

## CI Integration | CI 集成

Tests run automatically in GitHub Actions (`.github/workflows/test.yml`):

| Job | Steps | Trigger |
|-----|-------|---------|
| `test-frontend` | `pnpm test:run` + `tsc --noEmit` + `pnpm lint` + `pnpm audit` | Push/PR to master |
| `test-backend` | `cargo test -p camforge-core -p camforge-server` + `cargo clippy` + `cargo audit` | Push/PR to master |
| `build-check` | `pnpm build` (after both test jobs pass) | Push/PR to master |

### CI Quality Gates | CI 质量门

- All tests must pass (zero failures allowed)
- `cargo clippy` with `-D warnings` (treat warnings as errors)
- ESLint check passes (warnings allowed currently; `lint:strict` available for zero-warning enforcement)
- TypeScript type check passes (`tsc --noEmit`)
- `cargo audit` and `pnpm audit` run (advisory, non-blocking)

## Known Gaps & Roadmap | 已知缺口与路线图

| Gap | Priority | Plan |
|-----|----------|------|
| Tauri command tests (0 coverage) | High | Add `src-tauri/tests/` with Tauri test harness |
| Canvas rendering tests | Medium | Mock CanvasRenderingContext2D in Vitest, test drawing functions |
| Animation component tests | Medium | Test state machine (play/pause/step) in isolation |
| Layout component tests | Medium | Add tests for Sidebar, TitleBar, HelpPanel |
| E2E tests | Medium | Integrate Playwright, cover 3-5 critical flows |
| Coverage reporting in CI | Low | Add `cargo-tarpaulin` and `vitest --coverage` steps, enforce minimums |
