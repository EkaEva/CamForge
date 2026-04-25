# CamForge-Next v0.3.5 系统优化计划

> **制定日期**：2026-04-25
> **目标版本**：v0.3.5
> **依据文档**：`docs/CamForge-Next-review-v0.3.4-20260425.md`
> **问题总数**：68（严重 3 + 高 22 + 中 28 + 低 15）
> **本版本覆盖**：25 个问题（严重 3 + 高 12 + 中 8 + 低 2）

---

## 优化目标

| 维度 | 当前状态 | 目标状态 | 量化指标 |
|------|----------|----------|----------|
| 安全 | fs 权限全开、CORS 通配、全局 Tauri 暴露 | 权限最小化、CORS 白名单、ESM 导入 | 0 个高危安全配置 |
| 稳定性 | NaN 崩溃、Rust panic、动画空耗 | NaN 过滤、安全比较、Tab 切换暂停动画 | 0 个已知崩溃路径 |
| 功能 | 下载目录设置无效、移动端导出不透明 | 设置全局生效、导出路径可见 | 用户反馈问题清零 |
| 测试 | 前端核心模块 0 覆盖 | 核心逻辑基础覆盖 | ≥5 个前端测试文件 |
| 可访问性 | 缺少 ARIA、无焦点陷阱、无键盘支持 | WAI-ARIA 合规、焦点管理、键盘操作 | 4 个组件达标 |

---

## 第一阶段：安全与崩溃防护

> **目标**：消除所有高危安全配置和已知崩溃路径
> **预计修改文件**：6 个
> **验证标准**：安全配置审计通过 + 0 个 panic/NaN 崩溃

---

### 1.1 SEV-001: Tauri fs 权限添加 scope 限制

**问题**：`src-tauri/capabilities/default.json` 中 `fs` 插件权限为 `allow-all`，无路径限制。

**实施步骤**：

1. 打开 `src-tauri/capabilities/default.json`
2. 将 `fs` 权限从 `allow-all` 改为带 scope 的配置：
   ```json
   "fs": {
     "scope": {
       "allow": ["$DOWNLOAD/**", "$APPDATA/**"],
       "deny": ["**/.env", "**/*.keystore", "**/*.jks"]
     }
   }
   ```
3. 检查所有使用 `@tauri-apps/plugin-fs` 的代码，确认写入路径在允许范围内
4. 如有其他必要路径，添加到 `allow` 列表

**验证方法**：
- [ ] `src-tauri/capabilities/default.json` 中 `fs` 不包含 `"all": true`
- [ ] 快速导出文件正常保存到下载目录
- [ ] 自定义导出选择目录后文件正常保存
- [ ] 尝试写入 `/etc/` 等系统目录被拒绝

---

### 1.2 H-001: 关闭 withGlobalTauri

**问题**：`src-tauri/tauri.conf.json` 中 `withGlobalTauri: true` 暴露全局 API。

**实施步骤**：

1. 打开 `src-tauri/tauri.conf.json`
2. 将 `"withGlobalTauri": true` 改为 `"withGlobalTauri": false`
3. 全局搜索 `window.__TAURI` 和 `window.__TAURI_INTERNALS__`，确认所有引用改用 ES Module 导入
4. 特别检查 `src/utils/platform.ts` 中的 `isTauriEnv()` 函数，改用 try/catch 检测：
   ```typescript
   export function isTauriEnv(): boolean {
     try {
       return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
     } catch {
       return false;
     }
   }
   ```
5. 检查 `src/components/layout/Sidebar.tsx` 中 `setIsTauriEnv(!!(window as any).__TAURI__)`，改用 `isTauriEnv()` 工具函数

**验证方法**：
- [ ] `tauri.conf.json` 中 `withGlobalTauri` 为 `false`
- [ ] `grep -r "__TAURI" src/` 仅在 `platform.ts` 的检测逻辑中出现
- [ ] 应用启动正常，所有 Tauri 功能（导出、对话框）正常工作
- [ ] 浏览器控制台无 `__TAURI is not defined` 错误

---

### 1.3 H-005: NaN 值防护

**问题**：模拟计算可能产生 NaN，传入 Canvas 绘制导致图表异常。

**实施步骤**：

1. 在 `src/utils/chartDrawing.ts` 顶部添加辅助函数：
   ```typescript
   function sanitizeNumber(value: number, fallback = 0): number {
     return Number.isFinite(value) ? value : fallback;
   }
   ```
2. 在所有 Canvas 绑定坐标计算处（`moveTo`、`lineTo`、`arc` 等）使用 `sanitizeNumber` 包裹
3. 在 `drawLineChart`、`drawCamProfile` 等函数中，过滤数据点中的 NaN：
   ```typescript
   const validPoints = points.filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));
   ```
4. 在 `src/stores/simulation.ts` 的模拟结果处理中，添加 NaN 检测日志：
   ```typescript
   if (data.some(d => !Number.isFinite(d.s))) {
     console.warn('Simulation produced NaN values');
   }
   ```

**验证方法**：
- [ ] 输入极端参数（如 `h=0.1, r_0=1, e=50`）不导致图表崩溃
- [ ] 图表在 NaN 数据点处留空而非绘制异常线条
- [ ] 控制台输出 NaN 警告（如有）

---

### 1.4 H-014: Rust partial_cmp 安全化

**问题**：`crates/camforge-core/src/cam/geometry.rs` 中多处 `partial_cmp().unwrap()` 对 NaN 会 panic。

**实施步骤**：

1. 打开 `crates/camforge-core/src/cam/geometry.rs`
2. 全局搜索 `partial_cmp().unwrap()`，逐个替换为：
   ```rust
   // 替换前
   a.partial_cmp(&b).unwrap()
   // 替换后
   a.partial_cmp(&b).unwrap_or(std::cmp::Ordering::Equal)
   ```
3. 检查 `crates/camforge-core/src/` 下其他文件是否有相同问题
4. 运行 `cargo test` 确认所有测试通过

**验证方法**：
- [ ] `grep -r "partial_cmp().unwrap()" crates/` 返回 0 结果
- [ ] `cargo test` 全部通过
- [ ] 输入极端参数时 Rust 端不 panic

---

### 1.5 H-022: Rust Mutex unwrap 安全化

**问题**：`crates/camforge-server/src/main.rs` 中 `Mutex::lock().unwrap()` 在 poison 时会 panic。

**实施步骤**：

1. 打开 `crates/camforge-server/src/main.rs`
2. 搜索 `lock().unwrap()` 和 `.lock().unwrap()`
3. 替换为安全版本：
   ```rust
   // 替换前
   state.lock().unwrap()
   // 替换后
   state.lock().unwrap_or_else(|e| e.into_inner())
   ```
4. 运行 `cargo test` 确认通过

**验证方法**：
- [ ] `grep -r "lock().unwrap()" crates/camforge-server/` 返回 0 结果
- [ ] `cargo test` 全部通过

---

## 第二阶段：功能缺陷修复

> **目标**：修复用户反馈的功能问题和体验缺陷
> **预计修改文件**：8 个
> **验证标准**：用户反馈问题清零 + 导出功能全平台正常

---

### 2.1 SEV-003: 下载目录设置全局生效

**问题**：设置面板的下载目录仅影响自定义导出，快速导出不读取该设置。

**实施步骤**：

1. 打开 `src/stores/simulation.ts`，定位 `saveFile` 函数
2. 在 `saveFile` 函数中，当 `options.saveDir` 未传入时，从 settings store 读取：
   ```typescript
   import { useExportSettings } from './settings';

   // 在 saveFile 函数内部
   const saveDir = options.saveDir || useExportSettings().settings.downloadDir;
   ```
3. 注意：`useExportSettings()` 是响应式 hook，不能在非组件上下文调用。需要改为：
   - 在 `src/stores/settings.ts` 中导出一个非响应式的 getter 函数 `getExportSettings()`
   - 或在 `simulation.ts` 中直接读取 localStorage 中的下载目录设置
4. 推荐方案：在 `settings.ts` 中添加：
   ```typescript
   export function getDownloadDir(): string {
     try {
       const saved = localStorage.getItem('camforge-export-settings');
       if (saved) {
         const parsed = JSON.parse(saved);
         return parsed.downloadDir || '';
       }
     } catch {}
     return '';
   }
   ```
5. 在 `simulation.ts` 的 `saveFile` 中使用：
   ```typescript
   const finalSaveDir = options.saveDir || getDownloadDir();
   ```

**验证方法**：
- [ ] 设置面板配置下载目录后，快速导出文件保存到该目录
- [ ] 未配置下载目录时，快速导出使用系统默认目录
- [ ] 自定义导出仍正常工作
- [ ] 重启应用后设置仍然生效

---

### 2.2 H-009: 移动端导出文件位置透明化

**问题**：移动端导出后 Toast 仅显示"已保存到下载目录"，用户无法确认实际路径。

**实施步骤**：

1. 打开 `src/stores/simulation.ts`，定位移动端导出成功后的 Toast 调用
2. 修改 Toast 消息，包含实际文件路径：
   ```typescript
   // 替换前
   showToast(t().export.exported);
   // 替换后
   showToast(`${t().export.exported}: ${fileName}`);
   ```
3. 打开 `src/components/ui/Toast.tsx`
4. 修改 Toast 组件支持长文本显示：
   - 增加最大宽度
   - 文本超长时截断并显示省略号
   - 延长显示时间到 5 秒（已部分实现）
5. 在 `src/i18n/translations.ts` 中更新导出成功消息格式：
   - zh: `已导出到下载目录` → `已保存: {filename}`
   - en: `Exported` → `Saved: {filename}`

**验证方法**：
- [ ] 移动端快速导出后 Toast 显示文件名
- [ ] Toast 文本过长时正确截断
- [ ] 桌面端导出提示不受影响

---

### 2.3 H-017: 移动端自定义导出功能实现

**问题**：移动端点击自定义导出仅显示"仅支持桌面端"提示。

**实施步骤**：

1. 打开 `src/components/layout/MainCanvas.tsx`，定位自定义导出按钮区域
2. 移除移动端禁用逻辑，改为移动端适配版本：
   - 移动端不弹出目录选择对话框
   - 直接将选中文件逐个保存到系统下载目录
   - 使用与快速导出相同的保存逻辑
3. 修改自定义导出处理函数：
   ```typescript
   const handleCustomExport = async () => {
     if (isMobilePlatform()) {
       // 移动端：直接保存到下载目录
       for (const item of selectedItems) {
         await saveFile(item.data, item.fileName, { saveDir: '' });
       }
       showToast(t().export.exported);
     } else {
       // 桌面端：选择目录后保存
       const dir = await open({ directory: true });
       // ...existing logic
     }
   };
   ```
4. 更新 `src/i18n/translations.ts`，移除"仅支持桌面端"提示文本

**验证方法**：
- [ ] 移动端点击自定义导出不报错
- [ ] 移动端勾选多个文件后导出，所有文件均保存成功
- [ ] 桌面端自定义导出行为不变
- [ ] 移动端导出后 Toast 显示保存成功

---

### 2.4 H-015: 非活动 Tab 暂停动画

**问题**：切换到其他 Tab 时凸轮轮廓动画仍在后台运行，浪费资源。

**实施步骤**：

1. 打开 `src/components/layout/MainCanvas.tsx`
2. 找到动画循环（`requestAnimationFrame`）相关代码
3. 添加 Tab 可见性检查：
   ```typescript
   // 在动画循环中
   const animate = () => {
     if (activeTab() !== 'camProfile') {
       animationFrameId = requestAnimationFrame(animate);
       return; // 跳过绘制但保持循环
     }
     // ...existing drawing logic
   };
   ```
4. 优化：切换回凸轮轮廓 Tab 时立即重绘当前帧，避免视觉延迟

**验证方法**：
- [ ] 切换到"运动曲线"Tab 时，CPU 占用下降
- [ ] 切换回"凸轮轮廓"Tab 时，动画立即恢复
- [ ] 动画帧计数在非活动 Tab 时不变

---

### 2.5 H-018: GIF Worker 路径动态化

**问题**：GIF Worker 路径硬编码，Web 部署和 Tauri 生产构建路径可能不同。

**实施步骤**：

1. 打开 `src/stores/simulation.ts`，定位 GIF Worker 路径
2. 使用 Vite 推荐的 Worker 导入方式：
   ```typescript
   // 替换硬编码路径
   // 旧: new Worker('/gif.worker.js')
   // 新:
   const workerUrl = new URL(
     '../../node_modules/gif.js/dist/gif.worker.js',
     import.meta.url
   );
   ```
3. 或使用 Vite 的 `?worker` 导入语法（如 gif.js 支持）
4. 在 Tauri 开发模式和生产构建中分别测试

**验证方法**：
- [ ] `pnpm tauri dev` 模式下 GIF 导出正常
- [ ] `pnpm tauri build` 生产构建后 GIF 导出正常
- [ ] Web 模式（`pnpm dev`）GIF 导出正常

---

### 2.6 H-019: 导出错误恢复与进度提示

**问题**：多文件导出时中间失败无法恢复，用户得到不完整结果。

**实施步骤**：

1. 打开 `src/stores/simulation.ts`，定位自定义导出逻辑
2. 添加导出结果追踪：
   ```typescript
   const results: { name: string; success: boolean; error?: string }[] = [];
   for (const item of items) {
     try {
       await saveFile(...);
       results.push({ name: item.name, success: true });
     } catch (e) {
       results.push({ name: item.name, success: false, error: String(e) });
     }
   }
   ```
3. 导出完成后显示结果摘要：
   - 全部成功：显示成功 Toast
   - 部分失败：显示失败文件列表
   - 全部失败：显示错误提示
4. 在 `src/i18n/translations.ts` 中添加相关翻译

**验证方法**：
- [ ] 正常导出全部文件时显示成功提示
- [ ] 模拟导出失败时显示失败文件名
- [ ] 部分失败时成功文件已保存，失败文件有提示

---

### 2.7 M-006: 底部安全区域适配

**问题**：适配了顶部安全区域但未适配底部，有手势条的设备上内容被遮挡。

**实施步骤**：

1. 打开 `src/components/layout/MainCanvas.tsx`
2. 找到底部操作栏（状态栏、控制按钮区域）
3. 添加底部安全区域 padding：
   ```html
   <div style={{ 'padding-bottom': 'env(safe-area-inset-bottom)' }}>
   ```
4. 检查侧边栏底部操作栏（`Sidebar.tsx`）同样添加底部安全区域
5. 检查移动端 Tab 栏是否需要底部安全区域

**验证方法**：
- [ ] 在有底部手势条的设备上，底部按钮不被遮挡
- [ ] 无底部手势条的设备上，布局无多余空白

---

### 2.8 M-014: 导出 DPI 设置与设置面板联动

**问题**：设置面板的默认 DPI 仅影响自定义导出，快速导出固定 600 DPI。

**实施步骤**：

1. 打开 `src/stores/simulation.ts`，定位快速导出函数
2. 快速导出调用处读取设置面板的默认 DPI：
   ```typescript
   const { settings } = useExportSettings();
   // 或使用非响应式 getter
   const dpi = getExportDpi(); // 从 settings store 或 localStorage 读取
   ```
3. 替换硬编码的 `600` DPI 为动态值
4. 同样检查默认格式设置是否影响快速导出

**验证方法**：
- [ ] 设置面板 DPI 改为 300 后，快速导出文件 DPI 为 300
- [ ] 设置面板格式改为 PNG 后，快速导出文件格式为 PNG
- [ ] 默认设置下行为不变

---

## 第三阶段：性能与体验优化

> **目标**：优化资源消耗和用户体验
> **预计修改文件**：5 个
> **验证标准**：CPU 占用降低 + 移动端体验改善

---

### 3.1 M-016: 动画帧率限制

**问题**：动画使用 `requestAnimationFrame` 无帧率限制，高刷屏幕消耗更多资源。

**实施步骤**：

1. 打开 `src/components/layout/MainCanvas.tsx`，定位动画循环
2. 添加帧率限制逻辑：
   ```typescript
   const TARGET_FPS = 60;
   const FRAME_INTERVAL = 1000 / TARGET_FPS;
   let lastFrameTime = 0;

   const animate = (timestamp: number) => {
     const elapsed = timestamp - lastFrameTime;
     if (elapsed >= FRAME_INTERVAL) {
       lastFrameTime = timestamp - (elapsed % FRAME_INTERVAL);
       // ...existing drawing logic
     }
     animationFrameId = requestAnimationFrame(animate);
   };
   ```
3. 确保帧率限制不影响动画流畅度

**验证方法**：
- [ ] 120Hz 屏幕上动画帧率不超过 60fps
- [ ] 60Hz 屏幕上动画流畅度不变
- [ ] Chrome DevTools Performance 面板确认帧率

---

### 3.2 M-017: 图表绘制防抖

**问题**：参数变化时图表立即重绘，快速连续修改导致频繁重绘。

**实施步骤**：

1. 打开 `src/utils/chartDrawing.ts` 或图表绘制调用处
2. 使用 `requestAnimationFrame` 实现简单防抖：
   ```typescript
   let drawRAF: number | null = null;
   export function scheduleRedraw(drawFn: () => void) {
     if (drawRAF !== null) cancelAnimationFrame(drawRAF);
     drawRAF = requestAnimationFrame(() => {
       drawFn();
       drawRAF = null;
     });
   }
   ```
3. 在参数变化触发重绘时使用 `scheduleRedraw` 替代直接调用

**验证方法**：
- [ ] 快速拖动参数滑块时图表不卡顿
- [ ] 参数停止变化后图表在 1 帧内更新

---

### 3.3 M-013: Canvas 高 DPI 适配

**问题**：Canvas 绘制未考虑 `devicePixelRatio`，高 DPI 屏幕模糊。

**实施步骤**：

1. 打开 `src/utils/chartDrawing.ts`
2. 在 Canvas 初始化时设置实际分辨率：
   ```typescript
   const dpr = window.devicePixelRatio || 1;
   canvas.width = displayWidth * dpr;
   canvas.height = displayHeight * dpr;
   canvas.style.width = `${displayWidth}px`;
   canvas.style.height = `${displayHeight}px`;
   ctx.scale(dpr, dpr);
   ```
3. 确保所有绘制函数使用 CSS 像素坐标（已通过 scale 处理）
4. 在窗口 resize 时重新计算 DPI

**验证方法**：
- [ ] 2x DPI 屏幕上图表文字清晰
- [ ] 1x DPI 屏幕上图表正常
- [ ] 导出图片 DPI 不受此影响

---

### 3.4 M-005: 移动端触摸目标检查

**问题**：部分控件触摸目标小于 44x44px。

**实施步骤**：

1. 在移动端浏览器中逐个检查所有交互元素尺寸
2. 重点检查：
   - `NumberInput` 的增减按钮
   - `Select` 下拉框
   - `Toggle` 开关
   - Tab 按钮
   - 侧边栏折叠按钮
3. 对小于 44x44px 的元素添加 `min-w-[44px] min-h-[44px]` 或增大 padding
4. 确保增大触摸目标不影响桌面端布局

**验证方法**：
- [ ] 移动端所有可点击元素 ≥ 44x44px
- [ ] 桌面端布局不受影响
- [ ] 相邻触摸目标间距 ≥ 8px

---

### 3.5 L-004: MainCanvas 组件拆分

**问题**：MainCanvas.tsx 超过 900 行，包含多个功能模块。

**实施步骤**：

1. 将导出相关 UI 拆分到 `src/components/export/ExportPanel.tsx`
2. 将 Tab 栏拆分到 `src/components/layout/TabBar.tsx`
3. MainCanvas 仅保留布局编排和状态协调
4. 确保拆分后功能不变

**验证方法**：
- [ ] MainCanvas.tsx 行数 < 400
- [ ] 所有 Tab 功能正常
- [ ] 导出功能正常
- [ ] 动画功能正常

---

## 第四阶段：代码质量与可访问性

> **目标**：提升代码可维护性和可访问性合规
> **预计修改文件**：10+ 个
> **验证标准**：测试文件 ≥5 + 4 个组件可访问性达标

---

### 4.1 H-004: 核心模块测试补充

**问题**：前端核心业务逻辑零测试覆盖。

**实施步骤**：

1. 创建 `src/stores/__tests__/simulation.test.ts`：
   - 测试参数验证逻辑（`validateParams`）
   - 测试默认参数完整性
   - 测试边界参数（零行程、负偏距等）
2. 创建 `src/exporters/__tests__/tiff.test.ts`：
   - 测试 TIFF 编码输出格式
   - 测试 DPI 元数据写入
3. 创建 `src/utils/__tests__/chartDrawing.test.ts`：
   - 测试 `sanitizeNumber` 函数
   - 测试数据范围计算
4. 创建 `src/utils/__tests__/platform.test.ts`：
   - 测试 `isMobilePlatform()`
   - 测试 `isTauriEnv()`
5. 创建 `src/io/__tests__/storage.test.ts`：
   - 测试存储读写
   - 测试异常处理

**验证方法**：
- [ ] `pnpm test` 全部通过
- [ ] 前端测试文件数 ≥ 5
- [ ] 测试覆盖核心验证逻辑

---

### 4.2 H-010: SettingsPanel 焦点陷阱

**问题**：模态对话框无焦点陷阱，Tab 键可移出对话框。

**实施步骤**：

1. 打开 `src/components/layout/SettingsPanel.tsx`
2. 添加焦点陷阱逻辑：
   ```typescript
   let panelRef: HTMLDivElement | undefined;

   const handleKeyDown = (e: KeyboardEvent) => {
     if (e.key === 'Escape') {
       props.onClose();
       return;
     }
     if (e.key !== 'Tab') return;

     const focusable = panelRef?.querySelectorAll(
       'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
     );
     if (!focusable?.length) return;

     const first = focusable[0] as HTMLElement;
     const last = focusable[focusable.length - 1] as HTMLElement;

     if (e.shiftKey && document.activeElement === first) {
       e.preventDefault();
       last.focus();
     } else if (!e.shiftKey && document.activeElement === last) {
       e.preventDefault();
       first.focus();
     }
   };
   ```
3. 打开对话框时聚焦第一个可交互元素
4. 关闭对话框时恢复触发元素的焦点

**验证方法**：
- [ ] Tab 键无法将焦点移出设置面板
- [ ] Shift+Tab 可在面板内反向循环
- [ ] Escape 键关闭面板
- [ ] 关闭后焦点回到设置按钮

---

### 4.3 H-011: Toast ARIA 属性

**问题**：Toast 缺少 `role` 和 `aria-live` 属性。

**实施步骤**：

1. 打开 `src/components/ui/Toast.tsx`
2. 在 Toast 容器添加 ARIA 属性：
   ```html
   <div role="status" aria-live="polite" aria-atomic="true">
     {message()}
   </div>
   ```
3. 确保屏幕阅读器能播报 Toast 内容

**验证方法**：
- [ ] Toast 元素有 `role="status"` 属性
- [ ] Toast 元素有 `aria-live="polite"` 属性
- [ ] 屏幕阅读器（如 NVDA/VoiceOver）能播报 Toast 内容

---

### 4.4 H-012: Toggle 键盘支持

**问题**：Toggle 开关不支持键盘操作。

**实施步骤**：

1. 打开 `src/components/controls/Toggle.tsx`
2. 添加键盘事件处理：
   ```typescript
   const handleKeyDown = (e: KeyboardEvent) => {
     if (e.key === ' ' || e.key === 'Enter') {
       e.preventDefault();
       props.onChange(!props.checked);
     }
   };
   ```
3. 添加 `tabindex="0"` 使 Toggle 可聚焦
4. 添加聚焦样式（`focus:ring-2 focus:ring-blue-500`）

**验证方法**：
- [ ] Tab 键可聚焦到 Toggle
- [ ] Space/Enter 键可切换 Toggle 状态
- [ ] 聚焦时有可见的焦点环
- [ ] `aria-checked` 属性随状态更新

---

### 4.5 H-013: Tab 栏 ARIA 语义

**问题**：Tab 栏缺少 WAI-ARIA Tabs 模式语义。

**实施步骤**：

1. 打开 `src/components/layout/MainCanvas.tsx`
2. 为 Tab 容器添加 `role="tablist"`：
   ```html
   <div role="tablist" aria-label="Visualization tabs">
   ```
3. 为每个 Tab 按钮添加 `role="tab"` 和 `aria-selected`：
   ```html
   <button role="tab" aria-selected={activeTab() === 'camProfile'}>
   ```
4. 为每个 Tab 面板添加 `role="tabpanel"` 和 `aria-labelledby`：
   ```html
   <div role="tabpanel" aria-labelledby="tab-cam-profile">
   ```
5. 添加左右箭头键导航 Tab

**验证方法**：
- [ ] Tab 容器有 `role="tablist"`
- [ ] 每个 Tab 按钮有 `role="tab"` 和 `aria-selected`
- [ ] 每个 Tab 面板有 `role="tabpanel"`
- [ ] 左右箭头键可切换 Tab

---

### 4.6 M-001: 魔法数字常量化

**问题**：代码中存在未解释的魔法数字。

**实施步骤**：

1. 创建 `src/constants/numeric.ts`：
   ```typescript
   export const DATA_RANGE_MARGIN = 1.15;
   export const PERCENTILE_CLIP_LOW = 0.05;
   export const PERCENTILE_CLIP_HIGH = 0.95;
   export const EPSILON = 1e-10;
   export const TARGET_FPS = 60;
   export const MAX_UNDO_STEPS = 50;
   ```
2. 在 `src/utils/chartDrawing.ts` 中替换魔法数字
3. 在 `src/stores/simulation.ts` 中替换魔法数字
4. 确保替换后功能不变

**验证方法**：
- [ ] `grep -rn "1\.15\|1e-10\|0\.05\|0\.95" src/` 仅在 `numeric.ts` 中出现
- [ ] 图表绘制结果与替换前一致
- [ ] 模拟计算结果与替换前一致

---

### 4.7 M-002: localStorage 使用统一

**问题**：部分代码直接使用 `localStorage`，部分使用抽象层。

**实施步骤**：

1. 打开 `src/io/storage.ts`，确认抽象层接口
2. 搜索 `src/stores/simulation.ts` 中的 `localStorage` 直接调用
3. 替换为 `storage.get()` / `storage.set()` 调用
4. 确保替换后数据读写正常

**验证方法**：
- [ ] `grep -rn "localStorage" src/stores/` 返回 0 结果（仅 storage.ts 中允许）
- [ ] 预设保存/加载正常
- [ ] 设置持久化正常

---

### 4.8 M-003: 命名改进（注释补充）

**问题**：`tc_law`、`hc_law`、`sn`、`pz` 等缩写含义不清。

**实施步骤**：

1. 在 `src/constants/index.ts` 中为相关常量添加注释：
   ```typescript
   // tc = translating cam (推程)
   // hc = returning cam (回程)
   // sn = spin direction (旋向)
   // pz = offset direction (偏距方向)
   ```
2. 在 `src/i18n/translations.ts` 的类型定义中添加注释
3. 不重命名变量（避免大范围改动），仅通过注释说明

**验证方法**：
- [ ] 所有缩写变量有注释说明
- [ ] 代码功能不变

---

## 第五阶段：版本发布准备

> **目标**：更新版本号和文档，准备发布
> **预计修改文件**：5 个
> **验证标准**：版本号一致 + CHANGELOG 完整

---

### 5.1 版本号更新

**实施步骤**：

1. `package.json`: `"version": "0.3.5"`
2. `src-tauri/tauri.conf.json`: `"version": "0.3.5"`
3. `crates/camforge-core/Cargo.toml`: `version = "0.3.5"`
4. `crates/camforge-server/Cargo.toml`: `version = "0.3.5"`
5. `src/components/layout/StatusBar.tsx`: 版本显示更新（如有硬编码）

**验证方法**：
- [ ] `grep -r "0\.3\.4" --include="*.json" --include="*.toml" --include="*.tsx"` 返回 0 结果
- [ ] 应用启动后状态栏显示 v0.3.5

---

### 5.2 CHANGELOG 更新

**实施步骤**：

1. 打开 `CHANGELOG.md`
2. 在文件顶部添加 v0.3.5 变更记录：
   ```markdown
   ## [0.3.5] - 2026-04-25

   ### Security
   - **SEV-001**：Tauri fs 权限添加 scope 限制
   - **H-001**：关闭 withGlobalTauri，改用 ES Module 导入

   ### Fixed
   - **SEV-003**：设置面板下载目录现在影响快速导出
   - **H-005**：添加 NaN 值防护，避免图表崩溃
   - **H-009**：移动端导出后 Toast 显示文件名
   - **H-014**：Rust partial_cmp 安全化，避免 NaN panic
   - **H-017**：移动端支持自定义导出功能
   - **H-018**：GIF Worker 路径动态化
   - **H-019**：多文件导出添加错误恢复和进度提示
   - **H-022**：Rust Mutex unwrap 安全化
   - **M-006**：添加底部安全区域适配
   - **M-014**：快速导出读取设置面板的默认 DPI 和格式

   ### Changed
   - 非活动 Tab 暂停动画，降低 CPU 占用
   - 动画帧率限制为 60fps
   - Canvas 绘制适配高 DPI 屏幕
   - Tab 栏添加 WAI-ARIA 语义

   ### Added
   - **H-004**：新增 5 个前端测试文件
   - **H-010**：设置面板添加焦点陷阱
   - **H-011**：Toast 添加 ARIA 属性
   - **H-012**：Toggle 添加键盘支持
   - **M-001**：新增 `src/constants/numeric.ts` 常量定义
   ```
3. 添加版本比较链接：
   ```markdown
   [0.3.5]: https://github.com/EkaEva/CamForge-Next/compare/v0.3.4...v0.3.5
   ```

**验证方法**：
- [ ] CHANGELOG.md 包含 v0.3.5 记录
- [ ] 所有修复项均有对应条目

---

## 执行顺序总览

| 阶段 | 步骤 | 修改文件 | 预计耗时 |
|------|------|----------|----------|
| 一 | 1.1-1.5 | 5 个 | 1h |
| 二 | 2.1-2.8 | 8 个 | 2h |
| 三 | 3.1-3.5 | 5 个 | 1.5h |
| 四 | 4.1-4.8 | 10+ 个 | 2h |
| 五 | 5.1-5.2 | 5 个 | 0.5h |

**总计**：约 7 小时，25 个问题修复

---

## 验证总清单

### 安全验证
- [ ] SEV-001: fs 权限已限制 scope
- [ ] H-001: withGlobalTauri 已关闭
- [ ] H-005: NaN 值已防护
- [ ] H-014: Rust partial_cmp 已安全化
- [ ] H-022: Rust Mutex 已安全化

### 功能验证
- [ ] SEV-003: 下载目录设置全局生效
- [ ] H-009: 移动端导出路径可见
- [ ] H-017: 移动端自定义导出可用
- [ ] H-015: 非活动 Tab 暂停动画
- [ ] H-018: GIF Worker 路径动态化
- [ ] H-019: 导出错误恢复
- [ ] M-006: 底部安全区域适配
- [ ] M-014: 快速导出读取设置

### 性能验证
- [ ] M-016: 动画帧率 ≤60fps
- [ ] M-017: 图表绘制防抖
- [ ] M-013: Canvas 高 DPI 适配
- [ ] M-005: 触摸目标 ≥44px
- [ ] L-004: MainCanvas 拆分

### 质量验证
- [ ] H-004: 前端测试文件 ≥5
- [ ] H-010: 设置面板焦点陷阱
- [ ] H-011: Toast ARIA 属性
- [ ] H-012: Toggle 键盘支持
- [ ] H-013: Tab 栏 ARIA 语义
- [ ] M-001: 魔法数字常量化
- [ ] M-002: localStorage 统一
- [ ] M-003: 缩写注释补充

### 发布验证
- [ ] 版本号全部更新为 0.3.5
- [ ] CHANGELOG 已更新
- [ ] `pnpm test` 全部通过
- [ ] `cargo test` 全部通过
- [ ] `pnpm tauri dev` 运行正常
- [ ] 所有 Tab 功能正常
- [ ] 导出功能全格式正常
- [ ] 移动端布局正常

---

## 未覆盖问题（后续版本）

以下问题不在 v0.3.5 范围内，留待后续版本处理：

### v0.3.6 候选
- SEV-002: simulation.ts 职责拆分（大范围重构）
- H-002: 服务器认证
- H-003: 前端 Tauri/Server 代码去重
- H-006: CORS 白名单
- H-007: Docker 非 root 用户
- H-008: CI 凭据保护
- H-016: Android 存储权限
- H-020: 状态管理统一
- H-021: CSP 开发/生产区分

### v0.4.0 候选
- M-004: 死代码清理
- M-007: 键盘快捷键冲突
- M-008: 浏览器兼容性
- M-009: 未使用依赖
- M-010: Rust 错误处理统一
- M-011: Rust 测试补充
- M-012: TypeScript 类型安全
- M-015: 预设名称验证
- M-018: 移动端手势冲突
- M-019-M-028: 其他中优先级问题
- L-001-L-015: 低优先级问题

---

*本计划基于 v0.3.4 审查报告制定，按优先级分阶段执行。每阶段完成后进行验证，确保优化效果达到预期。*
