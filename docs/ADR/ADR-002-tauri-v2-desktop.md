# ADR-002: Tauri v2 for Desktop Application

**Status**: Accepted

## Context | 背景

CamForge needs a desktop application mode for offline/personal use. The application performs computation-heavy cam kinematics calculations and requires native file system access for export. Evaluated options:

1. **Electron** — Chromium-based, large ecosystem, but bundles the entire Chromium runtime (~150MB base binary), higher memory usage, and JavaScript-only backend.
2. **Tauri v2** — Rust-based shell, uses the system webview, Rust backend for IPC commands, multi-platform including mobile support.
3. **Native (Qt/wxWidgets)** — Maximum performance, but requires separate UI codebase, no web code reuse, and significantly higher development cost.

## Decision | 决策

Use Tauri v2 as the desktop application framework.

## Consequences | 后果

**Positive:**

- Small binary size. Tauri apps are typically 5-15MB vs Electron's 150MB+, because Tauri uses the OS-native webview (WebView2 on Windows, WebKit on macOS/Linux).
- Rust backend provides native performance for computation-heavy cam kinematics. The `camforge-core` Rust crate computes motion laws, cam profiles, and geometry analysis without crossing the JS/Rust boundary for intermediate steps — only the final `SimulationData` crosses IPC.
- Tauri v2 adds first-class mobile support (Android/iOS), which aligns with the project's multi-platform goals.
- Native file dialog and filesystem plugins (`tauri-plugin-dialog`, `tauri-plugin-fs`) provide secure file I/O without manual path validation at the JS level.
- LTO + codegen-units=1 + strip in release profile produces optimized small binaries.

**Negative:**

- System webview differences. WebView2 (Windows), WebKitGTK (Linux), and WebKit (macOS) may render subtle differences. Canvas API behavior is generally consistent, but CSS quirks exist.
- Tauri IPC is async and serializes data through JSON. For large `SimulationData` arrays (720 points x multiple fields), this introduces measurable latency. Currently mitigated by computing in Rust and returning only final results.
- Smaller community than Electron. Fewer troubleshooting resources and third-party plugins.
- Tauri v2 API is still evolving. Breaking changes between minor versions require periodic migration.

**Neutral:**

- The dual-mode architecture (Tauri IPC vs HTTP REST) requires an API adapter layer in the frontend to abstract the transport. This is an accepted tradeoff for supporting both desktop and web deployment.
