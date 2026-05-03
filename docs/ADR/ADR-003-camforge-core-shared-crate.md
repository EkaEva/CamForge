# ADR-003: camforge-core Shared Rust Crate

**Status**: Accepted

## Context | 背景

CamForge supports two deployment modes — desktop (Tauri) and web server (Axum) — that both need to perform identical cam kinematics computations: motion law calculation, cam profile generation, and geometric analysis (pressure angle, curvature radius). Two approaches were considered:

1. **Separate implementations** — Tauri commands and Axum routes each implement the computation pipeline independently, duplicating logic.
2. **Shared `camforge-core` crate** — A single Rust library crate in the Cargo workspace that both `src-tauri` and `camforge-server` depend on, providing the canonical implementation of all computation logic.

## Decision | 决策

Use `camforge-core` as a shared crate that is the single authoritative implementation of cam computation logic.

## Consequences | 后果

**Positive:**

- Eliminates computation duplication. Both Tauri commands (`src-tauri/src/commands/`) and Axum routes (`crates/camforge-server/src/routes/`) call the same `camforge-core` functions, guaranteeing identical results across desktop and web modes.
- Single source of truth for bug fixes. A fix in `camforge-core` automatically applies to both deployment modes, eliminating the risk of divergent behavior (which was a real problem — see HI-01 in the review: ~200 lines of duplicated computation code between Tauri and Axum handlers).
- Workspace dependency sharing via `camforge-core.workspace = true` keeps `serde`, `serde_json` versions aligned across all crates.
- `camforge-core` can be tested independently with `cargo test -p camforge-core`, providing focused unit test coverage for the math layer.
- The `compute_full_simulation(params) -> SimulationData` function encapsulates the entire multi-step computation pipeline (motion -> profile -> geometry), so consumers don't need to assemble the pipeline themselves.

**Negative:**

- Cargo workspace coupling. Changes to `camforge-core` must be compatible with both consumers. A breaking API change requires updating both `src-tauri` and `camforge-server` simultaneously.
- The Docker build must exclude `src-tauri` from the workspace (currently done via `sed` on `Cargo.toml` — see ME-19). This is fragile but manageable.
- `camforge-core` uses `String` as its error type (`Result<T, String>`) rather than structured error enums, which limits programmatic error handling. This is a known tradeoff accepted for simplicity.

**Neutral:**

- The current partial migration state: `compute_full_simulation` exists in `camforge-core` but Tauri commands still contain inline computation code. Full migration to use `compute_full_simulation` everywhere is tracked in the refactoring plan (HI-01).
- Dev-dependencies like `approx` (floating-point comparison) and `serde_json` are only needed for tests in `camforge-core` and are correctly scoped under `[dev-dependencies]`.
