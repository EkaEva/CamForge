# CamForge v0.4.16 项目结构与代码规范审查报告

| 项目 | 内容 |
|------|------|
| **项目名称** | CamForge — 凸轮机构运动学仿真器 |
| **项目版本** | v0.4.16 |
| **审查范围** | 项目目录结构逻辑性、文件命名一致性、代码注释质量与专业性、文件放置合理性、导出/导入模式规范性、代码风格一致性 |
| **审查方法** | 静态结构分析 + 命名规范合规检查 + 注释质量抽样评估 + 导出/导入模式扫描，与 CONTRIBUTING.md 定义的项目规范对照 |
| **审查时间** | 2026-05-04 |
| **审查工具** | Claude Code (claude-opus-4-7) |
| **ID 前缀** | SC-（Structure & Conventions） |

## 修复进度跟踪

| 严重程度 | 总数 | 已修复 | 已验证无需修复 | 未修复 | 完成率 |
|:--------:|:----:|:------:|:------:|:------:|:------:|
| High | 3 | 3 | 0 | 0 | 100% |
| Medium | 9 | 9 | 0 | 0 | 100% |
| Low | 14 | 12 | 2 | 0 | 100% |
| Info | 2 | 0 | 2 | 0 | 100% |
| **合计** | **28** | **24** | **4** | **0** | **100%** |

状态标记: ✅ 已修复 | ⬜ 未修复 | ⚠️ 已验证无需修复 | ⏳ 推迟至未来版本

## 问题统计摘要

### 按严重程度统计

| 严重程度 | 数量 | 说明 |
|:--------:|:----:|------|
| **High** | 3 | 结构/规范问题严重影响维护性或误导贡献者 |
| **Medium** | 9 | 规范违反降低代码质量但不影响功能 |
| **Low** | 14 | 轻微风格不一致或文档缺口 |
| **Info** | 2 | 观察记录，无需行动 |

### 按类别统计

| 类别 | High | Medium | Low | Info | 合计 |
|:-----|:----:|:-----:|:---:|:---:|:----:|
| **目录结构** | 1 | 2 | 2 | 0 | 5 |
| **命名规范** | 0 | 2 | 3 | 1 | 6 |
| **注释与文档质量** | 1 | 3 | 3 | 0 | 7 |
| **文件放置** | 0 | 1 | 2 | 1 | 4 |
| **导出/导入模式** | 1 | 1 | 2 | 0 | 4 |
| **代码风格一致性** | 0 | 3 | 3 | 0 | 6 |

---

## 目录结构问题

#### ✅ SC-01: `src/assets/` 空目录未被引用

- **问题描述**: `src/assets/` 目录存在但包含零文件，且无任何源文件引用该目录。所有静态资源实际存放在 `public/`。空目录误导新贡献者关于静态资源放置位置。
- **问题位置**: [src/assets/](src/assets/)
- **严重程度**: Low
- **问题类别**: 目录结构
- **改进建议**: 删除空目录。CONTRIBUTING.md 明确说明静态资源统一放置在 `public/`。

#### ✅ SC-02: `dist/` 和 `static/` 重复输出目录

- **问题描述**: `vite build` 输出到 `dist/`（Vite 默认），Dockerfile 通过 `COPY --from=frontend-builder /app/dist ./static` 将构建结果复制到 `static/` 供 Rust 服务器使用（`ServeDir::new("static")`）。然而 `static/` 作为陈旧构建产物存在于仓库中，与 `dist/` 内容几乎相同，造成混淆——不清楚哪个目录是真实来源。若有人直接运行 `./server` 而未重新构建，将使用陈旧内容。
- **问题位置**: [dist/](dist/)、[static/](static/)
- **严重程度**: Medium
- **问题类别**: 目录结构
- **改进建议**: 将 `static/` 和 `dist/` 加入 `.gitignore`。文档说明构建管线：`pnpm build` → `dist/`，Docker 构建时复制 `dist/` 到 `static/`。本地开发服务器应配置为直接从 `dist/` 提供静态文件。

#### ✅ SC-03: `stores/simulation/` 子目录模式 vs 其他 store 单文件模式

- **问题描述**: `src/stores/simulation/` 包含 10 个文件（core, compute, exports, exportFormats, exportSVG, presets, validation, randomize, index），采用子目录+barrel 模式。而 `settings.ts` 和 `history.ts` 为单文件。两种组织模式并存但无文档说明何时应拆分，新贡献者无法判断应采用哪种模式。
- **问题位置**: [src/stores/simulation/](src/stores/simulation/) vs [src/stores/settings.ts](src/stores/settings.ts)
- **严重程度**: Low
- **问题类别**: 目录结构
- **改进建议**: CONTRIBUTING.md 补充 store 组织约定："单文件 store 保持扁平（<200 行）；超过 200 行的 store 拆分为子目录并使用 `index.ts` barrel 导出。"

#### ✅ SC-04: `services/` 与 `api/` 目录边界不清

- **问题描述**: `src/api/` 提供 CamApi 报文适配层（HTTP/Tauri IPC 传输），职责明确。`src/services/` 包含 `motion.ts`（纯数学计算函数）和 `gifEncoder.ts`（媒体编码），命名暗示"业务服务层"但实际内容是纯计算和编码工具。新贡献者会期望 `services/` 包含调用 `api/` 的业务逻辑包装，而非纯函数。`computeSimulationLocally`（在 `stores/simulation/compute.ts`）导入 `services/motion.ts`，进一步模糊了"store 逻辑"与"service 逻辑"的边界。
- **问题位置**: [src/services/](src/services/)（2 文件）、[src/api/](src/api/)（3 文件）
- **严重程度**: Medium
- **问题类别**: 目录结构
- **改进建议**: 方案 A：将 `services/motion.ts` 移入 `utils/`（与 `array.ts`、`debounce.ts` 同类纯函数），将 `services/gifEncoder.ts` 移入 `exporters/`（与 DXF/CSV/TIFF 同类导出逻辑），删除 `services/` 目录。方案 B：重命名 `services/` 为 `computation/` 并在 CONTRIBUTING.md 明确边界：`api/` = 传输适配层，`computation/` = 重量级计算操作。

#### ✅ SC-05: CONTRIBUTING.md 项目结构树与实际目录严重不符

- **问题描述**: CONTRIBUTING.md 中记录的项目结构树与实际目录布局存在多处偏差：(1) `src/io/` 已列出但目录不存在（HI-04 修复后已删除）；(2) `src/hooks/`、`src/exporters/`、`src/workers/`、`src/splash/` 缺失；(3) `crates/camforge-core/src/` 缺少 `full_motion.rs`、`simulation.rs`；(4) `crates/camforge-server/src/` 缺少 `error.rs`、`lib.rs`、`openapi.rs`、`middleware/`；(5) `src/components/` 列为单一项目但实际有 5 个子目录（animation, charts, controls, layout, ui）。过时的结构树误导新贡献者对项目布局的理解。
- **问题位置**: [CONTRIBUTING.md](CONTRIBUTING.md)（项目结构树章节）
- **严重程度**: High
- **问题类别**: 目录结构
- **改进建议**: 更新项目结构树，完整反映当前目录布局，包括所有新增的子目录和文件。

---

## 命名规范问题

#### ✅ SC-06: `motion-laws.ts` 使用 kebab-case

- **问题描述**: `src/constants/` 中 6 个文件，5 个使用 camelCase（`chartColors.ts`、`cam.ts`、`display.ts`、`numeric.ts`、`index.ts`），但 `motion-laws.ts` 使用 kebab-case。CONTRIBUTING.md 未规定非组件 TypeScript 文件的命名约定。不一致的命名使按约定导航文件时难以预测文件名。
- **问题位置**: [src/constants/motion-laws.ts](src/constants/motion-laws.ts)
- **严重程度**: Low
- **问题类别**: 命名规范
- **改进建议**: 重命名 `motion-laws.ts` 为 `motionLaws.ts`，更新 `src/constants/index.ts` 中的导入路径。或在 CONTRIBUTING.md 明确约定非组件 TS 文件统一使用 camelCase。

#### ⚠️ SC-07: `chartColors.ts` 常量命名正确但未从 barrel 导出

- **问题描述**: `chartColors.ts` 内部常量使用 UPPER_SNAKE_CASE（如 `MOTION_COLORS`、`PRESSURE_ANGLE_COLORS`），符合 CONTRIBUTING.md 常量命名约定。但该文件未从 `src/constants/index.ts` barrel 重新导出，4 个图表绘制模块需直接路径导入（`../../constants/chartColors`），破坏了 barrel 模式的一致性。此问题与 SC-08 合并处理。
- **问题位置**: [src/constants/chartColors.ts](src/constants/chartColors.ts)、[src/constants/index.ts](src/constants/index.ts)
- **严重程度**: Info
- **问题类别**: 命名规范
- **改进建议**: 见 SC-08。

#### ✅ SC-08: `chartColors.ts` 未从 `constants/index.ts` barrel 重新导出

- **问题描述**: `src/constants/index.ts` 重新导出 `cam.ts`、`display.ts`、`motion-laws.ts`、`numeric.ts` 的内容，但未导出 `chartColors.ts`。4 个图表绘制模块（`motionCurves.ts`、`curvature.ts`、`pressureAngle.ts`、`camProfile.ts`）使用直接路径导入 `chartColors`，而其他常量通过 barrel 导入。导入路径风格不一致。
- **问题位置**: [src/constants/index.ts](src/constants/index.ts)
- **严重程度**: Low
- **问题类别**: 命名规范
- **改进建议**: 在 `src/constants/index.ts` 添加 `export { MOTION_COLORS, PRESSURE_ANGLE_COLORS, CURVATURE_COLORS, CAM_PROFILE_COLORS, ANIMATION_COLORS, CHART_COLORS, LINE_STYLES } from './chartColors';`。

#### ✅ SC-09: 前端验证错误消息中文 vs Rust 后端英文

- **问题描述**: `src/stores/simulation/validation.ts` 硬编码中文错误消息（如"四角之和必须等于 360°"、"基圆半径必须大于偏距的绝对值"），而 `crates/camforge-core/src/types.rs` 的 `validate()` 返回英文消息（如"Angle sum must equal 360 degree"、"Base circle radius must exceed |e| (offset)"）。用户在 Tauri 模式（后端验证）和 Web 模式（前端验证）之间切换时，看到不同语言的相同验证错误。前端验证完全绕过了 i18n 系统。
- **问题位置**: [src/stores/simulation/validation.ts](src/stores/simulation/validation.ts)、[crates/camforge-core/src/types.rs](crates/camforge-core/src/types.rs)
- **严重程度**: Medium
- **问题类别**: 命名规范
- **改进建议**: 方案 A：前端验证消息走 i18n 系统（`t('validation.angleSum')`），使语言随用户选择切换。方案 B：程序性验证错误统一英文，显示层翻译由 i18n 处理。CONTRIBUTING.md 约定用户可见字符串的国际化规范。

#### ✅ SC-10: `ZOOM_MIN`/`ZOOM_MAX` 常量已定义但 `CamAnimation.tsx` 硬编码值

- **问题描述**: `src/constants/numeric.ts` 定义了 `ZOOM_MIN = 0.2` 和 `ZOOM_MAX = 3.0`，但 `CamAnimation.tsx` 在滚轮事件（约第 41 行）和触摸捏合事件（约第 403 行）中硬编码 `Math.max(0.2, Math.min(3.0, ...))` 而非导入常量。值漂移风险。
- **问题位置**: [src/constants/numeric.ts](src/constants/numeric.ts)、[src/components/animation/CamAnimation.tsx](src/components/animation/CamAnimation.tsx)
- **严重程度**: Low
- **问题类别**: 命名规范
- **改进建议**: 在 `CamAnimation.tsx` 导入 `ZOOM_MIN` 和 `ZOOM_MAX`，替换硬编码值。

#### ✅ SC-11: `DEFAULT_DPI`/`MAX_DPI`/`MAX_DIMENSION` 定义位置不当

- **问题描述**: `chartDrawing/common.ts` 定义 `DEFAULT_DPI = 100`、`MAX_DPI = 600`、`MAX_DIMENSION = 10000` 作为模块级常量。这些是领域常量（图表渲染 DPI 限制），与 `constants/numeric.ts` 中的 `EPSILON`、`TARGET_FPS` 同类数值常量。将它们放在 `utils/` 子目录中降低了可发现性——贡献者不会在 `utils/chartDrawing/` 中寻找全局数值常量。现有 Review.md LO-06 已记录 `MAX_DPI` 在两处重复定义的问题，本项关注的是常量放置位置而非重复。
- **问题位置**: [src/utils/chartDrawing/common.ts](src/utils/chartDrawing/common.ts)
- **严重程度**: Medium
- **问题类别**: 命名规范
- **改进建议**: 将 `DEFAULT_DPI`、`MAX_DPI`、`MAX_DIMENSION` 移至 `src/constants/numeric.ts`，从 barrel 重新导出。`common.ts` 改为从 `constants` 导入这些值。

---

## 注释与文档质量问题

#### ✅ SC-12: `stores/settings.ts` 10 个导出函数全部缺少 JSDoc

- **问题描述**: `settings.ts` 导出 10 个函数（`initTheme`、`toggleTheme`、`setThemeMode`、`updateExportSettings`、`getDownloadDir`、`getDefaultDpi`、`getDefaultFormat`、`setDownloadDir`、`useTheme`、`useExportSettings`），仅有部分中文内联注释，无任何 JSDoc `@param`/`@returns` 标记。`useTheme()` 和 `useExportSettings()` 返回的对象属性语义也未文档化。CONTRIBUTING.md 要求"所有导出函数和类型使用 JSDoc"。
- **问题位置**: [src/stores/settings.ts](src/stores/settings.ts)
- **严重程度**: Medium
- **问题类别**: 注释与文档质量
- **改进建议**: 为全部 10 个导出函数补充 JSDoc，遵循 CONTRIBUTING.md 双语格式。

#### ✅ SC-13: `computeSimulationLocally`（318 行核心函数）缺少完整 JSDoc

- **问题描述**: `computeSimulationLocally` 是前端最关键的函数（318 行，执行全部凸轮轮廓计算），仅有第 1 行注释"Fallback: mirrors camforge-core::compute_full_motion. Keep formulas in sync with Rust."。函数的 `CamParams` 参数结构、`SimulationData` 返回值字段、NaN/Infinity 处理行为、与 Rust `compute_full_simulation` 的同步关系均未文档化。缺少文档使新贡献者难以理解此函数的计算步骤和错误处理路径。
- **问题位置**: [src/stores/simulation/compute.ts](src/stores/simulation/compute.ts)
- **严重程度**: High
- **问题类别**: 注释与文档质量
- **改进建议**: 补充完整 JSDoc：`@param p` 参数说明、`@returns SimulationData` 返回值结构、`@throws` NaN 处理行为说明、与 Rust `compute_full_simulation` 的同步维护注意事项。

#### ✅ SC-14: `stores/simulation/presets.ts` 6 个导出函数缺少 JSDoc

- **问题描述**: `savePreset`、`loadPreset`、`getSavedPresets`、`deletePreset`、`generatePresetJSON`、`loadPresetFromJSON` 均导出但无 JSDoc，仅有中文内联注释。
- **问题位置**: [src/stores/simulation/presets.ts](src/stores/simulation/presets.ts)
- **严重程度**: Low
- **问题类别**: 注释与文档质量
- **改进建议**: 补充双语 JSDoc 及 `@param`/`@returns` 标记。

#### ✅ SC-15: `randomizeParams`（含关键重试逻辑）缺少 JSDoc

- **问题描述**: `randomizeParams` 是异步函数，包含平底从动件凹面区域规避重试循环（CR-03 曾修复竞态条件），但缺少 JSDoc。函数的重试机制、参数约束和异步行为对维护者而言不直观。
- **问题位置**: [src/stores/simulation/randomize.ts](src/stores/simulation/randomize.ts)
- **严重程度**: Low
- **问题类别**: 注释与文档质量
- **改进建议**: 补充 JSDoc 说明重试逻辑（最多 10 次尝试）、参数约束范围和异步执行行为。

#### ✅ SC-16: `stores/simulation/exports.ts` 多个导出函数缺少 JSDoc

- **问题描述**: `generateDXF`、`generateCSV`、`downloadFile`、`saveFile`、`getCurrentLang`、`getExportFilename`、`generateExcel` 等导出函数无 JSDoc。
- **问题位置**: [src/stores/simulation/exports.ts](src/stores/simulation/exports.ts)
- **严重程度**: Low
- **问题类别**: 注释与文档质量
- **改进建议**: 补充双语 JSDoc。

#### ✅ SC-17: 16 个组件 Props 接口字段无 JSDoc

- **问题描述**: 项目中 16 个组件 Props 接口（`ToggleProps`、`SelectProps`、`NumberInputProps`、`IconProps`、`CamAnimationProps`、`FollowerRendererProps`、`AnimationControlsProps`、`MainCanvasProps`、`TitleBarProps`、`HelpPanelProps`、`SidebarProps`、`FollowerParamsPanelProps`、`ExportPanelProps`、`MotionParamsPanelProps`、`SettingsPanelProps`、`ErrorBoundaryProps`），仅 `IconProps` 有字段级 JSDoc 注释。其余 15 个接口的字段无任何文档，消费方需阅读组件实现才能理解 Props 语义。CONTRIBUTING.md 要求"所有导出类型使用 JSDoc"，Props 接口属于导出类型。
- **问题位置**: `src/components/` 下 15 个 Props 接口
- **严重程度**: Medium
- **问题类别**: 注释与文档质量
- **改进建议**: 为所有 Props 接口字段补充 `/** */` 注释。CONTRIBUTING.md 明确要求组件 Props 接口必须文档化。

#### ✅ SC-18: Rust 文件中重复和过时的章节标记

- **问题描述**: `crates/camforge-server/src/routes/export.rs` 中 `// ===== 辅助函数 =====` 出现两次（行 22 和行 176），行 22 的标记位于 DXF 导出路由处理器之前（并非辅助函数），是复制粘贴残留。`crates/camforge-core/src/motion.rs` 行 261 有 `// ===== 新增测试 =====` 标记，但该测试块已非"新增"而是既定代码。
- **问题位置**: [crates/camforge-server/src/routes/export.rs](crates/camforge-server/src/routes/export.rs)、[crates/camforge-core/src/motion.rs](crates/camforge-core/src/motion.rs)
- **严重程度**: Low
- **问题类别**: 注释与文档质量
- **改进建议**: 移除 `export.rs` 行 22 的错位标记，将行 176 的标记重命名为 `// ===== DXF 生成辅助 =====`。移除 `motion.rs` 的过时 `// ===== 新增测试 =====` 标记。

#### ✅ SC-19: 双语注释约定执行不一致

- **问题描述**: CONTRIBUTING.md 规定"双语注释（英文为主，中文为辅）"用于公共 API，但实际执行不一致：(1) `src/types/index.ts` 使用纯中文注释（`// 推程运动角 (度)`）；(2) `src/stores/settings.ts` 使用纯中文内联注释；(3) `src/services/motion.ts` 有完整双语 JSDoc；(4) `src/api/http.ts` 使用纯英文 JSDoc；(5) `src/constants/cam.ts` 和 `src/constants/display.ts` 使用 `///`（Rust 文档注释语法）而非 TypeScript `/** */`。双语约定被混合应用，导致代码库既非一致双语也非一致英文。
- **问题位置**: 多个 `src/` 文件
- **严重程度**: Medium
- **问题类别**: 注释与文档质量
- **改进建议**: (1) CONTRIBUTING.md 明确优先级：JSDoc 必须双语、内联注释可任选语言、Rust 验证消息英文（供 API 消费者）、显示层消息走 i18n。(2) 将 `cam.ts` 和 `display.ts` 中的 `///` 改为标准 `/** */` JSDoc 格式。

---

## 文件放置问题

#### ✅ SC-20: `components/__tests__/` 包含 `controls/` 子组件的测试文件

- **问题描述**: `src/components/__tests__/NumberInput.test.tsx`、`Select.test.tsx`、`Toggle.test.tsx` 测试的是 `src/components/controls/` 下的组件，但放在了 `src/components/__tests__/`。`animation/` 和 `layout/` 子目录正确拥有各自的 `__tests__/` 子目录，controls 却没有。这打破了测试与源码同目录的 co-location 模式，增加了查找特定组件测试的难度。
- **问题位置**: [src/components/__tests__/](src/components/__tests__/)
- **严重程度**: Medium
- **问题类别**: 文件放置
- **改进建议**: 创建 `src/components/controls/__tests__/` 目录，将 3 个测试文件移入。`ErrorBoundary.test.tsx` 保留在 `components/__tests__/`（因 ErrorBoundary 将移入 `ui/`，见 SC-21）。

#### ✅ SC-21: `ErrorBoundary.tsx` 是 `components/` 根目录唯一文件

- **问题描述**: 所有其他组件均组织在子目录中（animation, charts, controls, layout, ui），`ErrorBoundary.tsx` 是 `src/components/` 根目录的唯一文件。它同时拥有 named export 和 `export default`，与项目其他组件的 named-export-only 惯例不一致。ErrorBoundary 是 UI 工具组件，逻辑上属于 `ui/` 子目录（与 `Icon.tsx`、`Toast.tsx` 同类）。
- **问题位置**: [src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)
- **严重程度**: Low
- **问题类别**: 文件放置
- **改进建议**: 将 `ErrorBoundary.tsx` 移入 `src/components/ui/`，移除 `export default` 行，仅保留 named export。更新 `ui/index.ts` barrel 导出。

#### ✅ SC-22: `src/splash/` 使用 React/Remotion 但无说明文档

- **问题描述**: `src/splash/` 目录（`CamForgeSplash.tsx`、`Root.tsx`、`render.ts`）使用 React 和 Remotion（React 视频框架），而项目其余部分全部使用 SolidJS。这是合理的技术选择（Remotion 需要 React），但缺乏说明文档可能导致贡献者在 `src/` 中遇到 React 代码时困惑。
- **问题位置**: [src/splash/](src/splash/)
- **严重程度**: Low
- **问题类别**: 文件放置
- **改进建议**: 添加 `src/splash/README.md` 说明此目录使用 React/Remotion 的原因（Remotion 无 SolidJS 版本），以及构建和渲染命令。

#### ⚠️ SC-23: `src/workers/` 仅含 1 个文件，目录结构合理但无约定文档

- **问题描述**: `src/workers/` 仅包含 `tiffWorker.ts`。Web Workers 是独立于 utilities 的类别，单独目录合理，但仅 1 个文件使目录看起来像过早抽象。GIF worker 逻辑在 `services/gifEncoder.ts`（非 Web Worker，使用 gif.js 内部 worker），因此 `workers/` 目录特指 Web Workers 而非通用 worker 线程。
- **问题位置**: [src/workers/](src/workers/)
- **严重程度**: Info
- **问题类别**: 文件放置
- **改进建议**: CONTRIBUTING.md 补充约定："Web Workers 放置在 `src/workers/`，使用 `tiffWorker.ts` 命名模式。"

---

## 导出/导入模式问题

#### ✅ SC-24: `useChartInteraction` 和 `useChartPadding` 完全未被导入

- **问题描述**: `src/hooks/useChartInteraction.ts`（150 行）和 `src/hooks/useChartPadding.ts`（72 行）是完整实现的 SolidJS hooks，包含 TypeScript 接口、JSDoc 和综合逻辑。然而项目中无任何文件导入它们。三个图表组件（`MotionCurves.tsx`、`PressureAngleChart.tsx`、`CurvatureChart.tsx`）各自内联实现了相同的交互和填充逻辑。现有 Review.md HI-02 标记为"已修复"（添加了共享 tooltip 工具），但这两个 hooks 仍然是孤立导出——222 行死代码可能误导贡献者认为它们是图表交互的标准方式。
- **问题位置**: [src/hooks/useChartInteraction.ts](src/hooks/useChartInteraction.ts)、[src/hooks/useChartPadding.ts](src/hooks/useChartPadding.ts)
- **严重程度**: High
- **问题类别**: 导出/导入模式
- **改进建议**: 方案 A：重构三个图表组件使用这些 hooks（彻底解决 HI-02 重复问题）。方案 B：删除未使用的 hooks，文档说明图表交互在各组件内联处理。

#### ✅ SC-25: `getLanguageButtonText()` 导出但从未被外部导入

- **问题描述**: `src/i18n/index.ts` 导出 `getLanguageButtonText()` 但无任何外部文件导入它（语言切换按钮文本在 `App.tsx` 和 `TitleBar.tsx` 中内联计算）。同时存在两种 i18n 访问模式：直接导入 `import { t, language } from '../../i18n'` 和 hook 包装 `const { t, language } = useI18n()`，消费方使用不一致。
- **问题位置**: [src/i18n/index.ts](src/i18n/index.ts)
- **严重程度**: Low
- **问题类别**: 导出/导入模式
- **改进建议**: 删除未使用的 `getLanguageButtonText()` 导出。CONTRIBUTING.md 约定 i18n 访问模式：推荐直接导入 `t` 和 `language`，`useI18n()` 仅用于需要全部 i18n 功能的组件。

#### ✅ SC-26: `ChartPadding` 接口在两个文件中重复定义

- **问题描述**: `src/hooks/useChartInteraction.ts`（行 6-11）和 `src/hooks/useChartPadding.ts`（行 5-10）各自独立定义了相同的 `ChartPadding` 接口（`left`、`right`、`top`、`bottom` 四个字段）。违反 DRY 原则，存在漂移风险。虽然两个 hooks 当前未被消费（见 SC-24），但若将来启用，重复类型定义将造成混淆。
- **问题位置**: [src/hooks/useChartInteraction.ts](src/hooks/useChartInteraction.ts)、[src/hooks/useChartPadding.ts](src/hooks/useChartPadding.ts)
- **严重程度**: Medium
- **问题类别**: 导出/导入模式
- **改进建议**: 将 `ChartPadding` 接口提取到 `src/types/index.ts`，两个 hooks 文件改为从 `types` 导入。

#### ✅ SC-27: 3 个文件使用 `export default`，与项目 named-export-only 惯例不一致

- **问题描述**: `src/App.tsx`（行 152）、`src/components/ErrorBoundary.tsx`（行 51）和 `src/utils/tauri.ts`（行 85）使用 `export default`，而项目其余文件全部使用 named exports。`App.tsx` 和 `ErrorBoundary.tsx` 同时拥有 named export 和 default export，`tauri.ts` 导出 default 对象。不一致的导出模式使导入风格不可预测。
- **问题位置**: [src/App.tsx](src/App.tsx)、[src/components/ErrorBoundary.tsx](src/components/ErrorBoundary.tsx)、[src/utils/tauri.ts](src/utils/tauri.ts)
- **严重程度**: Low
- **问题类别**: 导出/导入模式
- **改进建议**: 从 `App.tsx` 和 `ErrorBoundary.tsx` 移除 `export default`（已有 named export）。重构 `tauri.ts` 使用 named exports。

---

## 代码风格一致性问题

#### ✅ SC-28: `animation.ts` 硬编码 20+ hex 颜色，未使用 `ANIMATION_COLORS` 常量

- **问题描述**: `src/utils/chartDrawing/animation.ts` 是唯一未导入 `chartColors.ts` 的图表绘制文件。它硬编码了 20+ hex 颜色值（如 `'#EF4444'` 凸轮轮廓红色、`'#4B5563'` 从动件灰色、`'#10B981'` 切线绿色、`'#F59E0B'` 法线琥珀色等），这些颜色与 `ANIMATION_COLORS` 常量对象中定义的值完全对应。其他三个图表绘制文件（`motionCurves.ts`、`curvature.ts`、`pressureAngle.ts`）已正确导入并使用各自的颜色常量。这意味着 `ANIMATION_COLORS` 和 `LINE_STYLES` 被定义但从未使用。
- **问题位置**: [src/utils/chartDrawing/animation.ts](src/utils/chartDrawing/animation.ts)
- **严重程度**: Medium
- **问题类别**: 代码风格一致性
- **改进建议**: 在 `animation.ts` 导入 `ANIMATION_COLORS`、`CHART_COLORS` 和 `LINE_STYLES`，替换所有硬编码颜色值。

#### ✅ SC-29: `isTauriEnv()` 在两个文件中重复定义，消费方导入不一致

- **问题描述**: `src/utils/tauri.ts`（行 12）和 `src/utils/platform.ts`（行 21）各自导出 `isTauriEnv()` 函数，实现略有不同。`tauri.ts` 仅检查 `window.__TAURI_INTERNALS__`，`platform.ts` 还提供 `isMobilePlatform()` 和 `isDesktopPlatform()`。消费方导入不一致：`stores/simulation/core.ts` 从 `utils/tauri` 导入，`components/` 从 `utils/platform` 导入。两个功能相同的函数分散在不同模块中造成混淆。
- **问题位置**: [src/utils/tauri.ts](src/utils/tauri.ts)、[src/utils/platform.ts](src/utils/platform.ts)
- **严重程度**: Medium
- **问题类别**: 代码风格一致性
- **改进建议**: 将 `isTauriEnv()` 统一到 `utils/platform.ts`（作为平台检测模块），`utils/tauri.ts` 改为从 `platform.ts` re-export。文档标注 `platform.ts` 为平台检测的规范来源。

#### ✅ SC-30: `exports.ts` 包装函数签名隐藏了 store 状态依赖

- **问题描述**: `src/stores/simulation/exports.ts` 的包装函数（如 `generateDXF(includeActual: boolean)`）调用 `exporters/` 版本但隐式读取 store 状态（`simulationData()` 和 `params()`）。`exporters/dxf.ts` 的 `generateDXF(data, includeActual)` 显式接收数据参数，而 `exports.ts` 版本仅接收一个布尔参数，调用方无法从签名看出函数依赖 reactive store 状态。
- **问题位置**: [src/stores/simulation/exports.ts](src/stores/simulation/exports.ts)
- **严重程度**: Low
- **问题类别**: 代码风格一致性
- **改进建议**: 为包装函数添加 JSDoc 明确说明"此函数从 reactive store 读取当前仿真数据"。考虑将包装函数命名为 `exportDXFFromCurrentState` 以区分签名差异。

#### ✅ SC-31: `cam.ts` 和 `display.ts` 使用 `///` Rust 文档注释语法而非 TypeScript `/** */`

- **问题描述**: `src/constants/cam.ts` 行 5 使用 `/// 默认凸轮设计参数`，`src/constants/display.ts` 行 3 使用类似语法。`///` 是 Rust 文档注释语法，TypeScript JSDoc 使用 `/** */`。非标准语法不会被 TypeDoc 等文档工具处理。
- **问题位置**: [src/constants/cam.ts](src/constants/cam.ts)、[src/constants/display.ts](src/constants/display.ts)
- **严重程度**: Low
- **问题类别**: 代码风格一致性
- **改进建议**: 将 `///` 改为标准 `/** */` JSDoc 格式。

#### ✅ SC-32: 导入路径风格不一致——barrel vs 直接文件路径

- **问题描述**: 导入路径无统一约定：(1) `App.tsx` 从 barrel `./components/layout` 导入 `TitleBar, Sidebar, MainCanvas`，但同时直接导入 `./components/layout/SettingsPanel`；(2) `exports.ts` 直接导入 `../../services/gifEncoder` 而从 barrel `../../exporters` 导入其他；(3) 图表组件直接导入 `../../stores/settings` 而非使用 hook。不一致的导入风格使项目约定模糊。
- **问题位置**: 多个 `src/` 文件
- **严重程度**: Low
- **问题类别**: 代码风格一致性
- **改进建议**: CONTRIBUTING.md 约定导入规则："优先从 `index.ts` barrel 导入。当 barrel 未导出所需符号或 tree-shaking 关键时，允许直接文件导入。"

#### ✅ SC-33: `src/test/`（setup）vs `__tests__/`（测试）命名可能混淆

- **问题描述**: `src/test/` 仅包含 `setup.ts`（vitest.config.ts 引用的全局 setup 文件），所有实际测试在 `__tests__/` 子目录中。贡献者看到 `src/test/` 可能期望测试文件在此，而非理解它是测试基础设施目录。
- **问题位置**: [src/test/](src/test/)、[src/**/__tests__/](src/)
- **严重程度**: Low
- **问题类别**: 代码风格一致性
- **改进建议**: CONTRIBUTING.md 说明："`src/test/` 包含测试基础设施（setup、mocks）；实际测试使用 `__tests__/` 目录与源码同位置放置。"

---

*审查完成时间: 2026-05-04 | 审查工具版本: Claude Code (claude-opus-4-7) | 当前修复版本: v0.4.16*