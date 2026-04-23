# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-04-23

### Added

- Initial release of CamForge-Next
- Support for 6 motion laws:
  - Uniform Motion
  - Constant Acceleration
  - Simple Harmonic
  - Cycloidal
  - 3-4-5 Polynomial
  - 4-5-6-7 Polynomial
- Real-time visualization:
  - Cam profile (theoretical and actual)
  - Motion curves (displacement, velocity, acceleration)
  - Pressure angle curve
  - Curvature radius curve
  - Animation demonstration
- Display options:
  - Tangent/Normal lines
  - Pressure angle arc
  - Base circle/Offset circle
  - Upper/Lower limit marks
  - Node markers
  - Phase boundary lines
- Multi-format export:
  - DXF (AutoCAD compatible)
  - CSV
  - Excel
  - SVG
  - TIFF (up to 600 DPI)
  - GIF animation
  - JSON preset
- Chinese/English internationalization
- Hot language switching without page reload
- Preset management (save/load/delete)
- Keyboard shortcuts for animation control

### Technical

- Built with Tauri v2 + SolidJS + TypeScript + Tailwind CSS
- Rust backend with ndarray and rayon for parallel computing
- Responsive UI with dark mode support
- Cross-platform support (Windows, macOS, Linux)
