# CamForge v0.3.4 系统性审查报告

> **审查日期**：2026-04-25
> **审查版本**：v0.3.4（含热修复）
> **审查范围**：前端代码、Rust 后端、安全配置、依赖项、测试覆盖、移动端兼容性

---

## 审查概览

| 指标 | 数值 |
|------|------|
| 审查文件数 | ~60+ |
| 发现问题总数 | **68** |
| 严重 (SEVERE) | 3 |
| 高优先级 (HIGH) | 22 |
| 中优先级 (MEDIUM) | 28 |
| 低优先级 (LOW) | 15 |

---

## 问题统计

### 按严重程度分布

```
SEVERE ████░░░░░░░░░░░░░░░░  3  (4.4%)
HIGH   ████████████████████░  22 (32.4%)
MEDIUM ██████████████████████  28 (41.2%)
LOW    █████████████░░░░░░░░  15 (22.0%)
```

### 按类别分布

| 类别 | 数量 |
|------|------|
| 安全 (Security) | 8 |
| 功能缺陷 (Bug) | 12 |
| 架构 (Architecture) | 9 |
| 代码质量 (Code Quality) | 14 |
| 测试 (Testing) | 5 |
| 可访问性 (Accessibility) | 6 |
| 移动端 (Mobile) | 8 |
| 兼容性 (Compatibility) | 6 |

---

## 严重问题 (SEVERE)

### SEV-001: Tauri fs 权限缺少 scope 限制

**文件**: `src-tauri/capabilities/default.json`

**问题**: `fs` 插件权限配置为 `allow-all`，未限制文件系统访问范围。恶意代码或 XSS 漏洞可利用此权限读写任意文件。

**当前配置**:
```json
"fs": {
  "all": true,
  "scope": {}
}
```

**建议修复**:
```json
"fs": {
  "scope": {
    "allow": ["$DOWNLOAD/**", "$APPDATA/**"],
    "deny": ["$APPDATA/../**"]
  }
}
```

**影响**: 攻击者可通过前端漏洞读取/写入用户任意文件。

---

### SEV-002: simulation.ts 职责过重（2500+ 行）

**文件**: `src/stores/simulation.ts`

**问题**: 该文件承担了状态管理、模拟计算、文件导出、GIF 生成、预设管理、撤销重做等所有核心逻辑，超过 2500 行。任何修改都可能引发连锁反应，且难以测试和维护。

**建议修复**:
1. 将导出逻辑拆分到 `src/exporters/` 目录（部分已完成：`tiff.ts`, `dxf.ts`, `csv.ts`, `excel.ts`）
2. 将预设管理拆分到 `src/stores/preset.ts`
3. 将撤销/重做拆分到 `src/stores/undo.ts`
4. 将 GIF 生成拆分到 `src/exporters/gif.ts`
5. simulation.ts 仅保留核心状态和模拟调度

**影响**: 代码可维护性差，修改风险高，测试困难。

---

### SEV-003: 设置面板下载目录不影响快速导出

**文件**: `src/stores/simulation.ts`, `src/stores/settings.ts`, `src/components/layout/MainCanvas.tsx`

**问题**: 设置面板中配置的下载目录仅影响自定义导出，快速导出（Quick Export）始终使用系统默认下载目录。用户配置下载目录后期望所有导出都使用该目录，但实际无效。

**根因**: `saveFile` 函数接受 `options.saveDir` 参数，但快速导出调用时从未传递该参数。

**建议修复**:
1. 在 `saveFile` 函数中，当 `saveDir` 未传入时，从 settings store 读取默认下载目录
2. 或在快速导出调用处传递 `settings.downloadDir`

**影响**: 用户设置无效，功能体验不一致。

---

## 高优先级问题 (HIGH)

### H-001: `withGlobalTauri: true` 安全风险

**文件**: `src-tauri/tauri.conf.json`

**问题**: `withGlobalTauri: true` 将 Tauri API 暴露到 `window.__TAURI__` 全局对象，任何第三方脚本都可以调用 Tauri 命令。

**建议**: 设为 `false`，使用 `@tauri-apps/api` 的 ES Module 导入方式。

---

### H-002: 服务器绑定 0.0.0.0 无认证

**文件**: `crates/camforge-server/src/main.rs`

**问题**: Axum 服务器绑定 `0.0.0.0:3000`，无任何认证机制，局域网内任何人可访问。

**建议**: 添加基本认证或 API Token 验证；默认绑定 `127.0.0.1`。

---

### H-003: 前端代码 Tauri/Server 重复

**文件**: `src/stores/simulation.ts`

**问题**: `runSimulation()` 中 Tauri 调用和 HTTP API 调用的逻辑存在大量重复代码（参数构建、结果处理），维护时需要同步修改两处。

**建议**: 抽象统一的 API 适配层，Tauri 和 HTTP 仅实现底层调用差异。

---

### H-004: 核心模块零测试覆盖

**文件**: `src/stores/simulation.ts`, `src/utils/chartDrawing.ts`, `src/exporters/`

**问题**: 前端核心业务逻辑（模拟计算、图表绘制、导出功能）没有任何单元测试。仅有的测试覆盖了路径验证和工具函数。

**建议**: 优先为以下模块添加测试：
1. 参数验证逻辑
2. 模拟计算结果正确性
3. 导出文件格式正确性
4. 图表绘制边界条件

---

### H-005: NaN 值未防护

**文件**: `src/utils/chartDrawing.ts`, `src/stores/simulation.ts`

**问题**: 模拟计算可能产生 NaN 值（如除零、0 的负数次幂），直接传入 Canvas 绘制会导致图表异常或崩溃。

**建议**: 在计算结果输出和图表绘制入口添加 NaN 过滤。

---

### H-006: CORS 配置使用通配符

**文件**: `crates/camforge-server/src/main.rs`

**问题**: CORS 配置允许任意来源访问，生产环境存在安全风险。

**建议**: 通过环境变量 `CORS_ORIGINS` 配置白名单，默认仅允许 `localhost`。

---

### H-007: Docker 容器以 root 运行

**文件**: `Dockerfile`

**问题**: 最终运行阶段未创建非 root 用户，容器以 root 身份运行。

**建议**: 添加非 root 用户：
```dockerfile
RUN adduser --disabled-password --gecos "" appuser
USER appuser
```

---

### H-008: CI 可能泄露凭据

**文件**: `.github/workflows/build.yml`

**问题**: Android 签名密钥通过环境变量传递，但未确认日志中是否屏蔽了敏感值。

**建议**: 确认 GitHub Actions 自动屏蔽 secrets；添加 `echo "::add-mask::"` 显式屏蔽。

---

### H-009: 移动端导出文件位置不透明

**文件**: `src/stores/simulation.ts`, `src/components/layout/MainCanvas.tsx`

**问题**: 移动端快速导出后，Toast 仅显示"已保存到下载目录"，用户无法确认文件实际保存位置。不同 Android 设备的"下载目录"路径不同，部分设备可能保存到应用私有目录。

**建议**:
1. 导出成功后显示完整文件路径
2. 提供"打开文件"或"分享文件"按钮
3. 使用 Android 的 MediaStore API 确保文件出现在系统下载目录

---

### H-010: SettingsPanel 缺少焦点陷阱

**文件**: `src/components/layout/SettingsPanel.tsx`

**问题**: 模态对话框未实现焦点陷阱（focus trap），Tab 键可以将焦点移出对话框到背景元素，键盘用户可能无法正常操作。

**建议**: 添加焦点陷阱逻辑，Escape 键关闭对话框。

---

### H-011: Toast 缺少 ARIA 属性

**文件**: `src/components/ui/Toast.tsx`

**问题**: Toast 通知缺少 `role="alert"` 和 `aria-live="assertive"` 属性，屏幕阅读器无法感知通知内容。

**建议**: 添加 `role="status"` 和 `aria-live="polite"` 属性。

---

### H-012: Toggle 组件缺少键盘支持

**文件**: `src/components/controls/Toggle.tsx`

**问题**: Toggle 开关不支持 Space/Enter 键切换状态，仅能通过鼠标点击操作。

**建议**: 添加 `tabindex="0"` 和 `onKeyDown` 处理 Space/Enter 键。

---

### H-013: Tab 栏缺少 ARIA 属性

**文件**: `src/components/layout/MainCanvas.tsx`

**问题**: Tab 栏未使用 `role="tablist"` / `role="tab"` / `role="tabpanel"` 语义，屏幕阅读器无法理解 Tab 导航结构。

**建议**: 添加 WAI-ARIA Tabs 模式的语义标记。

---

### H-014: Rust `partial_cmp().unwrap()` 可能 panic

**文件**: `crates/camforge-core/src/cam/geometry.rs`

**问题**: 多处使用 `partial_cmp().unwrap()`，当比较 NaN 值时 `partial_cmp` 返回 `None`，`unwrap()` 会导致 panic。

**建议**: 使用 `partial_cmp().unwrap_or(Ordering::Equal)` 或显式处理 None 情况。

---

### H-015: 非活动 Tab 动画继续运行

**文件**: `src/components/layout/MainCanvas.tsx`

**问题**: 切换到其他 Tab 时，凸轮轮廓动画仍在后台运行，浪费 CPU 和电池资源。

**建议**: 在 Tab 切换时暂停动画，切换回来时恢复。

---

### H-016: Android 存储权限声明不足

**文件**: `src-tauri/gen/android/app/src/main/AndroidManifest.xml`

**问题**: 仅声明了 `WRITE_EXTERNAL_STORAGE`，缺少 `READ_EXTERNAL_STORAGE` 和 Android 13+ 的 `READ_MEDIA_IMAGES` 权限，可能导致导出文件不可见。

**建议**: 根据 Android 版本动态请求适当的存储权限。

---

### H-017: 移动端无法使用自定义导出

**文件**: `src/components/layout/MainCanvas.tsx`

**问题**: 移动端点击自定义导出仅显示提示"自定义导出仅支持桌面端"，但移动端用户同样有批量导出需求。

**建议**: 移动端自定义导出改为：选择文件后逐个保存到下载目录，无需目录选择器。

---

### H-018: GIF Worker 路径硬编码

**文件**: `src/stores/simulation.ts`

**问题**: GIF Worker 路径使用硬编码的相对路径，在 Web 部署和 Tauri 生产构建中路径可能不同。

**建议**: 使用 `import.meta.url` 或 Vite 的 `new URL()` 语法动态解析 Worker 路径。

---

### H-019: 导出函数缺少错误恢复

**文件**: `src/stores/simulation.ts`

**问题**: 多文件导出时，如果中间某个文件导出失败，已导出的文件无法回滚，用户得到不完整的导出结果且无明确提示。

**建议**: 添加导出进度指示和失败文件列表；或提供"重试失败项"功能。

---

### H-020: 前端状态管理不一致

**文件**: `src/stores/simulation.ts`

**问题**: 部分状态使用 `createSignal`，部分使用 `createStore`，部分使用模块级变量，模式不统一。例如 `paramsChanged` 是普通变量而非响应式信号。

**建议**: 统一使用 `createStore` 管理复杂状态，`createSignal` 管理简单状态，消除模块级非响应式变量。

---

### H-021: CSP 配置可能过严

**文件**: `src-tauri/tauri.conf.json`

**问题**: CSP 的 `connect-src` 仅允许特定端口，开发时如果 Vite 使用其他端口会导致 HMR 失败。

**建议**: 开发环境使用宽松 CSP，生产环境收紧。可通过环境变量区分。

---

### H-022: Rust Mutex unwrap 风险

**文件**: `crates/camforge-server/src/main.rs`

**问题**: 多处 `Mutex::lock().unwrap()` 调用，如果锁被 poison（持有锁的线程 panic），会导致服务器 panic 崩溃。

**建议**: 使用 `lock().unwrap_or_else(|e| e.into_inner())` 忽略 poison，或使用 `parking_lot::Mutex` 替代。

---

## 中优先级问题 (MEDIUM)

### M-001: 魔法数字未常量化

**文件**: `src/utils/chartDrawing.ts`, `src/stores/simulation.ts`

**问题**: 代码中存在未解释的魔法数字，如 `1.15`（数据范围边距）、`0.05`/`0.95`（百分位裁剪）、`1e-10`（浮点比较 epsilon）。

**建议**: 提取到 `src/constants/numeric.ts`。

---

### M-002: localStorage 使用不统一

**文件**: `src/stores/simulation.ts`

**问题**: 部分代码直接使用 `localStorage`，部分使用 `src/io/storage.ts` 抽象层。

**建议**: 统一使用 storage 抽象层。

---

### M-003: 命名不一致

**文件**: 多个文件

**问题**: 中英文混用命名：`tc_law`/`hc_law`（缩写）、`delta_0`/`delta_ret`（混合）、`sn`（无意义缩写）、`pz`（无意义缩写）。

**建议**: 统一使用完整英文命名或中文注释说明缩写含义。

---

### M-004: 死代码

**文件**: `src/stores/simulation.ts`

**问题**: 存在未使用的函数和变量，如旧的 `generateTIFF` 别名、未使用的导入。

**建议**: 清理未使用的代码。

---

### M-005: 移动端触摸目标偏小

**文件**: `src/components/controls/NumberInput.tsx`, `src/components/controls/Select.tsx`

**问题**: 部分控件触摸目标仍小于 44x44px 推荐值。

**建议**: 检查并增大所有交互元素触摸区域。

---

### M-006: 底部安全区域缺失

**文件**: `src/components/layout/MainCanvas.tsx`

**问题**: 适配了顶部安全区域 `env(safe-area-inset-top)`，但未适配底部安全区域 `env(safe-area-inset-bottom)`，在有底部手势条的设备上内容可能被遮挡。

**建议**: 为底部操作栏添加 `padding-bottom: env(safe-area-inset-bottom)`。

---

### M-007: 键盘快捷键冲突

**文件**: `src/stores/simulation.ts`

**问题**: `Ctrl+Z`/`Ctrl+Y` 撤销重做快捷键可能与浏览器默认行为冲突。

**建议**: 添加 `e.preventDefault()` 并仅在特定条件下拦截。

---

### M-008: 浏览器兼容性

**文件**: `src/exporters/tiff.ts`

**问题**: TIFF 导出使用 `Uint8Array` 的某些方法，在旧版浏览器可能不支持。

**建议**: 添加 polyfill 或降级方案。

---

### M-009: 未使用的依赖

**文件**: `package.json`

**问题**: 可能存在未使用的 npm 依赖，增加打包体积。

**建议**: 运行 `pnpm dlx depcheck` 检查并清理。

---

### M-010: Rust 错误处理不统一

**文件**: `crates/camforge-core/src/`

**问题**: 部分函数使用 `Result<T, E>` 返回错误，部分直接 panic，部分返回默认值。

**建议**: 统一使用 `Result<T, E>` 和自定义错误类型。

---

### M-011: Rust 测试覆盖不足

**文件**: `crates/camforge-core/src/`

**问题**: 核心计算模块测试用例较少，边界条件测试缺失（如零行程、负偏距、极大角度等）。

**建议**: 添加边界条件和异常输入测试。

---

### M-012: 前端类型安全不足

**文件**: `src/stores/simulation.ts`

**问题**: 多处使用 `as any` 类型断言和 `as never` 强制转换。

**建议**: 完善类型定义，减少类型断言。

---

### M-013: Canvas 绘制未处理 DPI 缩放

**文件**: `src/utils/chartDrawing.ts`

**问题**: Canvas 绘制未考虑 `devicePixelRatio`，在高 DPI 屏幕上可能模糊。

**建议**: 设置 Canvas 实际尺寸为显示尺寸 × devicePixelRatio，并 scale 上下文。

---

### M-014: 导出 DPI 设置未与设置面板联动

**文件**: `src/components/layout/MainCanvas.tsx`

**问题**: 设置面板的默认 DPI 设置仅影响自定义导出，快速导出固定使用 600 DPI。

**建议**: 快速导出也应读取设置面板的默认 DPI。

---

### M-015: 预设管理缺少输入验证

**文件**: `src/stores/simulation.ts`

**问题**: 预设名称未做长度限制和特殊字符过滤，可能导致 localStorage 键冲突。

**建议**: 添加预设名称验证规则。

---

### M-016: 动画帧率未限制

**文件**: `src/components/layout/MainCanvas.tsx`

**问题**: 动画使用 `requestAnimationFrame` 但未限制帧率，高刷新率屏幕会消耗更多资源。

**建议**: 添加帧率限制（如 60fps）。

---

### M-017: 图表绘制缺少防抖

**文件**: `src/utils/chartDrawing.ts`

**问题**: 参数变化时图表立即重绘，快速连续修改参数可能导致频繁重绘。

**建议**: 添加 requestAnimationFrame 防抖。

---

### M-018: 移动端侧边栏手势冲突

**文件**: `src/components/layout/MainCanvas.tsx`

**问题**: 侧边栏滑动手势可能与 Canvas 缩放手势冲突。

**建议**: 添加手势识别区域和优先级判断。

---

### M-019: SVG 导出缺少元数据

**文件**: `src/stores/simulation.ts`

**问题**: SVG 导出未包含 DPI、创建时间等元数据。

**建议**: 在 SVG 中添加元数据属性。

---

### M-020: Excel 导出缺少样式

**文件**: `src/exporters/excel.ts`

**问题**: Excel 导出的数据无格式化（无表头样式、列宽自适应等）。

**建议**: 添加基本样式和列宽设置。

---

### M-021: HTTP API 缺少请求频率限制

**文件**: `crates/camforge-server/src/main.rs`

**问题**: API 端点无请求频率限制，可能被滥用。

**建议**: 添加 rate limiting 中间件。

---

### M-022: 前端未处理网络错误重试

**文件**: `src/stores/simulation.ts`

**问题**: HTTP API 调用失败后无重试机制，网络波动可能导致计算失败。

**建议**: 添加指数退避重试逻辑。

---

### M-023: Docker 镜像未使用多阶段构建优化

**文件**: `Dockerfile`

**问题**: 虽然使用了多阶段构建，但最终镜像仍包含不必要的文件。

**建议**: 使用 `cargo-chef` 进一步优化构建缓存；最终阶段仅复制必要二进制文件。

---

### M-024: GitHub Actions 缓存未优化

**文件**: `.github/workflows/build.yml`

**问题**: Rust 编译缓存配置可能不够优化，每次构建时间较长。

**建议**: 使用 `Swatinem/rust-cache` action 优化 Rust 编译缓存。

---

### M-025: 移动端横屏适配缺失

**文件**: `src/components/layout/MainCanvas.tsx`

**问题**: 移动端横屏时布局未做特殊处理，可能导致内容挤压。

**建议**: 添加横屏布局适配或锁定竖屏方向。

---

### M-026: PWA Service Worker 缺失

**文件**: `public/manifest.json`

**问题**: 已配置 PWA manifest 但缺少 Service Worker，无法实现离线访问和缓存策略。

**建议**: 添加 Service Worker 实现基本缓存策略。

---

### M-027: 前端日志未分级

**文件**: 多个文件

**问题**: `console.log`/`console.error` 混用，生产环境未移除调试日志。

**建议**: 使用统一的日志工具，生产环境移除 debug 级别日志。

---

### M-028: 组件 Props 类型定义不完整

**文件**: `src/components/controls/`

**问题**: 部分组件 Props 接口缺少可选属性标记和默认值文档。

**建议**: 完善 Props 类型定义，添加 JSDoc 注释。

---

## 低优先级问题 (LOW)

### L-001: CSS 类名过长

**文件**: 多个组件

**问题**: Tailwind CSS 类名过长，影响代码可读性。

**建议**: 提取常用类组合为组件或使用 `@apply`。

---

### L-002: 图标使用内联 SVG

**文件**: `src/components/layout/Sidebar.tsx`, `src/components/layout/SettingsPanel.tsx`

**问题**: 图标使用内联 SVG，增加组件代码量且难以复用。

**建议**: 提取为独立的图标组件或使用图标库。

---

### L-003: 颜色值硬编码

**文件**: `src/utils/chartDrawing.ts`

**问题**: 图表颜色使用硬编码的十六进制值，未与 Tailwind 主题色关联。

**建议**: 从 CSS 变量或主题配置中读取颜色。

---

### L-004: 组件文件过大

**文件**: `src/components/layout/MainCanvas.tsx`

**问题**: MainCanvas.tsx 超过 900 行，包含导出、Tab、动画等多个功能模块。

**建议**: 拆分为更小的子组件。

---

### L-005: 缺少代码格式化配置

**问题**: 项目缺少 Prettier 配置，代码风格可能不一致。

**建议**: 添加 Prettier 配置和 pre-commit hook。

---

### L-006: TypeScript strict 模式未完全启用

**文件**: `tsconfig.json`

**问题**: 可能未启用 `strict: true`，部分类型检查被跳过。

**建议**: 启用 strict 模式并修复类型错误。

---

### L-007: Rust clippy 警告未处理

**问题**: 可能存在 clippy 警告未处理。

**建议**: 运行 `cargo clippy` 并修复所有警告。

---

### L-008: 缺少 CHANGELOG 自动生成

**问题**: CHANGELOG 手动维护，可能遗漏变更。

**建议**: 考虑使用 conventional commits 自动生成。

---

### L-009: README 截图可能过时

**文件**: `README.md`

**问题**: README 中的截图可能未随 UI 更新。

**建议**: 更新截图以反映当前版本 UI。

---

### L-010: 缺少贡献者指南

**文件**: `CONTRIBUTING.md`

**问题**: 贡献指南内容较简单，缺少开发环境搭建详细步骤。

**建议**: 补充完整的开发环境搭建指南。

---

### L-011: 环境变量文档缺失

**问题**: 服务器端环境变量（如 CORS_ORIGINS、PORT）未在文档中说明。

**建议**: 在 `docs/DEPLOYMENT.md` 中补充环境变量说明。

---

### L-012: 缺少性能基准测试

**问题**: 无性能基准测试，无法量化优化效果。

**建议**: 为核心计算模块添加 criterion 基准测试。

---

### L-013: 移动端缺少启动画面

**问题**: PWA 缺少 splash screen 配置。

**建议**: 在 manifest.json 中添加 splash screen 配置。

---

### L-014: 缺少错误上报

**问题**: 前端错误未上报到任何监控系统。

**建议**: 考虑集成 Sentry 或类似服务。

---

### L-015: Rust 文档注释不完整

**文件**: `crates/camforge-core/src/`

**问题**: 公共 API 缺少 `///` 文档注释。

**建议**: 为所有公共函数添加文档注释。

---

## 优先级建议

### v0.3.5 应修复（严重 + 高优先级精选）

| 编号 | 问题 | 理由 |
|------|------|------|
| SEV-001 | Tauri fs 权限 | 安全漏洞 |
| SEV-003 | 下载目录设置无效 | 用户反馈的功能缺陷 |
| H-009 | 移动端导出位置不透明 | 用户反馈的体验问题 |
| H-017 | 移动端无法自定义导出 | 功能缺失 |
| H-004 | 核心模块零测试 | 质量保障 |
| H-005 | NaN 值未防护 | 可能导致崩溃 |
| H-014 | Rust partial_cmp panic | 可能导致崩溃 |
| H-015 | 非活动 Tab 动画 | 性能和电池消耗 |

### v0.3.6 可修复（高优先级剩余 + 中优先级精选）

| 编号 | 问题 | 理由 |
|------|------|------|
| SEV-002 | simulation.ts 拆分 | 可维护性 |
| H-001 | withGlobalTauri | 安全 |
| H-002 | 服务器认证 | 安全 |
| H-006 | CORS 通配符 | 安全 |
| H-010-H-013 | 可访问性 | 合规性 |
| M-001 | 魔法数字常量化 | 代码质量 |
| M-006 | 底部安全区域 | 移动端体验 |

### 后续版本修复

- 中优先级剩余问题
- 低优先级问题
- PWA 完善
- 性能优化

---

## 审查方法

本次审查采用以下方法：

1. **静态代码分析**：逐文件审查前端 TypeScript/TSX 和后端 Rust 代码
2. **安全审查**：检查 Tauri 权限配置、CSP、CORS、文件路径验证
3. **依赖审查**：检查 package.json 和 Cargo.toml 依赖项
4. **测试审查**：检查测试覆盖率和测试质量
5. **移动端审查**：检查移动端适配、安全区域、触摸目标
6. **可访问性审查**：检查 ARIA 属性、键盘导航、焦点管理
7. **架构审查**：检查模块划分、状态管理、代码复用

---

*本报告由系统性审查生成，建议按优先级分阶段修复。*
