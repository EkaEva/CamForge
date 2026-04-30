# CamForge v0.4.6 系统优化计划

> **制定日期**：2026-04-30
> **目标版本**：v0.4.6
> **依据**：用户反馈的 3 项移动端问题
> **原则**：每阶段可独立验证，阶段内按优先级排序，先修复后优化

---

## 问题分析

### 问题 1：移动端状态栏重复显示导出路径

**现象**：移动端导出成功后，Toast 小卡片已显示完整保存路径，状态栏又重复显示路径，且路径过长挤压其他提示信息。

**根因**：
- `MainCanvas.tsx` 中 `handleExport`（约 L242）和 `handleCustomExport`（约 L403）调用 `setExportStatus()` 时，`message` 无条件包含 `→ ${path}` 路径信息
- 移动端状态栏（约 L629-640）渲染 `exportStatus().message` 时使用 `break-all`，长路径换行占据大量空间
- Toast 已在移动端独立显示路径（约 L243-257、L408-421），状态栏的路径信息冗余

**影响**：状态栏空间被路径占据，"已计算 N 个点"等正常提示被挤压或不可见

### 问题 2：移动端界面可左右滑动

**现象**：移动端整个界面可以水平滑动，出现空白区域。

**根因**：
- `App.tsx` 移动端 header（约 L64-126）右侧有 6 个按钮（撤销、重做、语言、主题、设置、帮助），每个 `w-10`（40px）
- 按钮间 `gap-0.5`（2px），6 个按钮总宽 = 6×40 + 5×2 = 250px
- 加上左侧菜单按钮（44px）、标题、padding（32px），总宽 ≈ 326px + 标题宽度
- 在 320px 窄屏手机上超出视口宽度，导致水平溢出
- header 和 body 均无 `overflow-x: hidden`，溢出表现为可左右滑动

**影响**：用户可意外触发水平滚动，体验不佳

### 问题 3：Tauri 移动端对话框/文件选择器不工作

**现象**：
1. 导出成功后 Toast 的"打开位置"按钮点击无反应
2. 自定义导出无法选择下载路径，直接导出且失败
3. 设置面板"选择"下载目录按钮点击无反应

**根因**：
- **"打开位置"按钮**：`MainCanvas.tsx` 中 `revealFileInManager()` 使用 `invoke('reveal_item_in_dir', { path })` 调用 `tauri-plugin-opener`，但该插件可能未在 `src-tauri/Cargo.toml` 中注册，或 `capabilities/default.json` 缺少 `opener` 权限
- **"选择"下载目录按钮**：`SettingsPanel.tsx` 中 `handleSelectDownloadDir()` 使用 `@tauri-apps/plugin-dialog` 的 `open({ directory: true })`，但 Tauri dialog 插件在移动端（Android/iOS）**不支持目录选择**，仅支持 `save()` 保存文件对话框
- **自定义导出路径选择**：`MainCanvas.tsx` 中 `handleCustomExport` 已用 `!isMobilePlatform()` 保护目录选择器，移动端跳过选择直接使用默认目录，但如果默认目录为空且无法选择，导出可能失败

**影响**：Tauri 移动端导出功能不可用，设置面板下载目录无法配置

---

## Phase 0：版本号更新

**目标**：将版本号从 v0.4.5 更新至 v0.4.6，建立优化基线

### 步骤

| # | 任务 | 文件 | 验证方法 |
|---|------|------|----------|
| 0.1 | 更新前端版本号 | `package.json` L3 | `"version": "0.4.6"` |
| 0.2 | 更新 Rust 工作区版本号 | `Cargo.toml` L10 | `version = "0.4.6"` |
| 0.3 | 更新 Tauri 配置版本号 | `src-tauri/tauri.conf.json` L4 | `"version": "0.4.6"` |
| 0.4 | 更新启动动画版本号 | `index.html` L84 | `v0.4.6 · SolidJS + Tauri` |
| 0.5 | 更新 README 版本徽章 | `README.md` L7 | `version-0.4.6`，链接指向 `v0.4.6` |
| 0.6 | 更新 CHANGELOG | `CHANGELOG.md` | 在文件顶部添加 `## [0.4.6] - 2026-04-30` 条目 |
| 0.7 | 更新 CHANGELOG 比较链接 | `CHANGELOG.md` | 添加 `[0.4.5]: https://github.com/EkaEva/CamForge/compare/v0.4.4...v0.4.5` 和 `[0.4.6]` 链接 |

### 验证标准

- [ ] `grep -r "0\.4\.5" package.json Cargo.toml src-tauri/tauri.conf.json index.html README.md` 返回空
- [ ] 开发服务器 `pnpm dev` 启动正常，页面显示 v0.4.6

---

## Phase 1：移动端状态栏导出路径冗余修复

**目标**：移动端状态栏不再显示导出路径，仅由 Toast 承担路径展示职责

### 步骤

| # | 任务 | 文件 | 验证方法 |
|---|------|------|----------|
| 1.1 | 单次导出：移动端 `setExportStatus` 不含路径 | `src/components/layout/MainCanvas.tsx` 约 L241-242 | 当 `isMobilePlatform()` 为 true 时，`pathInfo` 设为空字符串 `''`，状态栏仅显示 `"已导出: filename"` |
| 1.2 | 自定义导出：移动端 `setExportStatus` 不含路径 | `src/components/layout/MainCanvas.tsx` 约 L402-407 | 同上，移动端 `pathInfo` 设为空字符串 |
| 1.3 | 移动端状态栏导出信息添加 `truncate` | `src/components/layout/MainCanvas.tsx` 约 L629-640 | 移动端状态栏导出消息从 `max-w-full break-all` 改为 `truncate max-w-[60%]`，确保不挤压其他元素 |

### 验证标准

- [ ] 移动端快速导出成功后，状态栏仅显示 `"已导出: filename"`，不含路径
- [ ] 移动端自定义导出成功后，状态栏仅显示 `"已导出: N files"`，不含路径
- [ ] Toast 仍正常显示完整路径 + "打开位置"按钮（Tauri 端）
- [ ] 桌面端状态栏仍显示完整路径（不受影响）
- [ ] 状态栏其他提示（"已计算 N 个点"）不被挤压

---

## Phase 2：移动端水平滑动修复

**目标**：移动端界面不可水平滑动，所有内容限制在视口宽度内

### 步骤

| # | 任务 | 文件 | 验证方法 |
|---|------|------|----------|
| 2.1 | header 添加 `overflow-x-hidden` | `src/App.tsx` 约 L64 | 移动端 header 的 class 添加 `overflow-x-hidden`，防止内容溢出 |
| 2.2 | 减小移动端按钮尺寸 | `src/App.tsx` 约 L79-124 | 6 个操作按钮从 `w-10 h-10`（40px）改为 `w-9 h-9`（36px），节省 6×4 = 24px |
| 2.3 | 减小按钮间距 | `src/App.tsx` 约 L74 | 按钮组从 `gap-0.5`（2px）改为 `gap-px`（1px），节省 5×1 = 5px |
| 2.4 | 标题添加 `truncate min-w-0` | `src/App.tsx` 约 L73 | 标题 span 添加 `truncate min-w-0`，允许标题在空间不足时截断而非撑开 |
| 2.5 | 全局添加水平溢出保护 | `src/App.tsx` 或 `index.html` | 在 body 或最外层 div 添加 `overflow-x-hidden` class，作为最终防线 |

### 计算验证

修改后移动端 header 最小宽度：
- 左 padding: 16px
- 菜单按钮: 44px
- 标题 margin: 12px
- 标题: 弹性宽度（truncate 保护）
- 6 个按钮: 6×36 = 216px
- 5 个间距: 5×1 = 5px
- 右 padding: 16px
- **固定部分总计**: 16 + 44 + 12 + 216 + 5 + 16 = **309px**

在 320px 窄屏下，标题可用宽度 = 320 - 309 = 11px，标题会被 truncate 截断但不会溢出。在 375px（iPhone SE）下，标题可用 66px，足够显示 "CamForge"。

### 验证标准

- [ ] 320px 宽度下界面不可水平滑动
- [ ] 375px 宽度下所有按钮可见且可点击
- [ ] 标题在窄屏下截断而非撑开布局
- [ ] 桌面端布局不受影响（按钮仍为 `w-10 h-10`）
- [ ] 所有按钮触摸区域 ≥ 36×36px（满足可访问性最低要求）

---

## Phase 3：Tauri 移动端对话框/文件选择器修复

**目标**：Tauri 移动端导出功能完全可用，"打开位置"按钮正常工作，下载目录可配置

### 3A. "打开位置"按钮修复

**分析**：`revealFileInManager()` 使用 `invoke('reveal_item_in_dir', { path })`，这需要 `tauri-plugin-opener` 已注册且有权限。

| # | 任务 | 文件 | 验证方法 |
|---|------|------|----------|
| 3.1 | 检查 `tauri-plugin-opener` 是否在 Cargo.toml | `src-tauri/Cargo.toml` | 若缺失则添加 `tauri-plugin-opener = "2"` |
| 3.2 | 在 `lib.rs` 中注册 opener 插件 | `src-tauri/src/lib.rs` | `.plugin(tauri_plugin_opener::init())` |
| 3.3 | 添加 opener 权限到 capabilities | `src-tauri/capabilities/default.json` | 添加 `"opener:default"` 权限 |
| 3.4 | 改用 `@tauri-apps/plugin-opener` JS API | `src/components/layout/MainCanvas.tsx` | `revealFileInManager()` 改为 `const { revealItemInDir } = await import('@tauri-apps/plugin-opener'); await revealItemInDir(filePath);`，移除 `invoke('reveal_item_in_dir')` 调用 |

### 3B. 设置面板下载目录选择修复

**分析**：`@tauri-apps/plugin-dialog` 的 `open({ directory: true })` 在移动端不支持。移动端应使用 `@tauri-apps/plugin-fs` 的系统目录 API 获取可用目录，或提供替代方案。

| # | 任务 | 文件 | 验证方法 |
|---|------|------|----------|
| 3.5 | 移动端设置面板：隐藏"选择"按钮 | `src/components/layout/SettingsPanel.tsx` 约 L70-84 | 当 `isMobilePlatform()` 时，不渲染"选择"按钮，仅显示当前路径（只读）+ "清除"按钮 |
| 3.6 | 移动端设置面板：添加快捷目录选项 | `src/components/layout/SettingsPanel.tsx` | 移动端新增快捷目录按钮组：`下载目录`、`文档目录`、`图片目录`，使用 `@tauri-apps/api/path` 的 `downloadDir()`/`documentDir()`/`pictureDir()` 获取系统目录路径 |
| 3.7 | 添加 i18n 翻译 | `src/i18n/translations.ts` | 新增 `settings.downloadDirQuick`：zh `"快捷目录"` / en `"Quick Directories"`；`settings.dirDownload`：zh `"下载"` / en `"Download"`；`settings.dirDocument`：zh `"文档"` / en `"Documents"`；`settings.dirPicture`：zh `"图片"` / en `"Pictures"` |

### 3C. 自定义导出路径选择修复

**分析**：移动端已跳过目录选择器（`!isMobilePlatform()` 保护），但若 `saveDir` 为空，`saveFile` 会使用系统下载目录。需确保此路径始终有效。

| # | 任务 | 文件 | 验证方法 |
|---|------|------|----------|
| 3.8 | 确认 `saveFile` 移动端回退路径有效 | `src/stores/simulation.ts` 约 L481-483 | 验证 `downloadDir()` 在 Tauri 移动端返回有效路径；添加 try-catch 和错误提示 |
| 3.9 | 自定义导出移动端：无 saveDir 时使用系统下载目录 | `src/components/layout/MainCanvas.tsx` 约 L301-313 | 移动端不弹出目录选择器，直接使用 `downloadDir()` 作为 saveDir，与 `saveFile` 行为一致 |

### 验证标准

- [ ] Tauri Android 端导出成功后，Toast "打开位置"按钮点击后打开文件管理器并定位到文件
- [ ] Tauri Android 端设置面板显示快捷目录按钮（下载/文档/图片），点击后路径更新
- [ ] Tauri Android 端设置面板不显示"选择"按钮（因目录选择器不可用）
- [ ] Tauri Android 端自定义导出正常工作，文件保存到下载目录
- [ ] 桌面端设置面板仍显示"选择"按钮，目录选择器正常工作
- [ ] 桌面端"打开位置"按钮正常工作

---

## Phase 4：综合验证与回归测试

**目标**：确认所有修复无副作用，桌面端和移动端功能正常

### 步骤

| # | 任务 | 验证方法 |
|---|------|----------|
| 4.1 | 前端测试通过 | `pnpm test:run` 全部通过 |
| 4.2 | Rust 测试通过 | `cargo test --workspace` 全部通过 |
| 4.3 | 生产构建成功 | `pnpm build` 无错误 |
| 4.4 | 桌面端功能回归 | 开发服务器验证：导出、设置、状态栏、header 布局均正常 |
| 4.5 | 移动端浏览器验证 | 375px 宽度下：无水平滑动、状态栏无路径、导出 Toast 正常 |
| 4.6 | Tauri 移动端验证 | APK 安装后：导出成功 + "打开位置"可用、设置面板快捷目录可用、自定义导出可用 |

### 验证标准

- [ ] 所有自动化测试通过
- [ ] 桌面端无功能回归
- [ ] 移动端 3 个问题全部解决
- [ ] 无新增控制台错误

---

## 执行顺序与依赖关系

```
Phase 0 (版本号更新)
    ↓
Phase 1 (状态栏路径冗余) ← 独立修复，无外部依赖
    ↓
Phase 2 (水平滑动修复) ← 独立修复，无外部依赖
    ↓
Phase 3 (Tauri 移动端对话框) ← 依赖 Phase 1（Toast 承担路径展示）
    ↓
Phase 4 (综合验证) ← 依赖 Phase 1-3 全部完成
```

**建议**：每个 Phase 完成后在开发服务器上验证，确认无回归后再进入下一阶段。

---

## 版本发布检查清单

Phase 0-4 全部完成后：

- [ ] 所有文件中版本号统一为 `0.4.6`
- [ ] `pnpm test:run` 全部通过
- [ ] `cargo test --workspace` 全部通过
- [ ] `pnpm build` 构建成功
- [ ] 开发服务器手动验证桌面端功能正常
- [ ] 移动端浏览器手动验证 UI 正常
- [ ] Tauri 移动端手动验证导出和设置功能正常
- [ ] CHANGELOG.md 更新完整
- [ ] README.md 版本号和路线图更新
- [ ] 无敏感文件在 Git 中
