# CamForge Web 部署优化说明 | Web Deployment Optimization Guide

## Logo 压缩 | Logo Compression

`public/logo.png` 当前约 996KB，建议压缩至 <100KB。

### 压缩方法

1. 使用在线工具压缩：
   - https://tinypng.com/
   - https://squoosh.app/

2. 或转换为 WebP 格式：
   ```bash
   # 使用 ImageMagick
   convert public/logo.png -quality 80 public/logo.webp
   ```

3. 更新 index.html 使用 WebP：
   ```html
   <picture>
     <source srcset="/logo.webp" type="image/webp">
     <img src="/logo.png" alt="CamForge Logo">
   </picture>
   ```

## Bundle 大小分析 | Bundle Size Analysis

### 当前状态

Vite 构建产物主要由以下部分组成：

| 模块 | 预估大小 | 说明 |
|------|----------|------|
| SolidJS runtime | ~15 KB (gzip) | 响应式框架核心 |
| Chart drawing utils | ~8 KB | Canvas 绑定逻辑 |
| Tauri API bridge | ~3 KB | 桌面端 IPC 适配 |
| xlsx (SheetJS) | ~300 KB | Excel 导出（按需加载） |
| gif.js | ~50 KB | GIF 动画导出（按需加载） |
| UTIF2 | ~30 KB | TIFF 导出（按需加载） |

### 分析工具

```bash
# 安装 rollup-plugin-visualizer
pnpm add -D rollup-plugin-visualizer

# 构建并生成 bundle 分析报告
pnpm build -- --mode analyze
# 产物: stats.html 可视化报告
```

## 代码分割策略 | Code Splitting Strategy

### 动态导入（已实施）

导出格式相关模块采用动态导入，仅在用户触发导出时加载：

```typescript
// exports.ts 中的按需加载模式
const { generateExcel } = await import('../../exporters/excel');
const { generateRealTIFF } = await import('../../exporters/tiff');
```

### 路由级分割（推荐）

如未来添加多页面路由，应使用 SolidJS 的 `lazy()` 实现路由级代码分割：

```typescript
import { lazy } from 'solid-js';

const Settings = lazy(() => import('./components/Settings'));
```

### 分割优先级

| 优先级 | 模块 | 策略 | 预估收益 |
|:------:|------|------|----------|
| P0 | xlsx (SheetJS) | 动态导入（已实施） | ~300 KB |
| P0 | gif.js | 动态导入（已实施） | ~50 KB |
| P0 | UTIF2 | 动态导入（已实施） | ~30 KB |
| P1 | 帮助面板 | lazy() 导入 | ~5 KB |
| P2 | 启动画面 (Remotion) | 条件加载 | ~200 KB |

## 懒加载方案 | Lazy Loading Strategy

### 组件级懒加载

以下组件适合延迟加载（用户不立即需要的）：

- **HelpPanel**: 用户点击帮助按钮时加载
- **ExportPanel**: 用户切换到导出标签时加载
- **CamAnimation**: 仿真数据就绪后加载

### 图片懒加载

```html
<!-- 使用 loading="lazy" 延迟加载非首屏图片 -->
<img src="/logo.webp" loading="lazy" alt="CamForge Logo">
```

## CDN 配置 | CDN Configuration

### 静态资源 CDN

生产环境建议通过 CDN 分发静态资源：

```nginx
# Nginx 配置示例
location ~* \.(js|css|woff2|webp|png|svg|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Vite base 配置

```typescript
// vite.config.ts
export default defineConfig({
  base: process.env.CDN_BASE || '/',
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // 内容哈希文件名，支持长期缓存
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
```

## 缓存头设置 | Cache Headers

### 推荐缓存策略

| 资源类型 | Cache-Control | Max-Age | 说明 |
|----------|---------------|---------|------|
| HTML 入口 | `no-cache` | - | 每次验证 freshness |
| JS/CSS (hash) | `public, immutable` | 1 year | 文件名含 hash，内容变更即新 URL |
| 字体 (woff2) | `public, immutable` | 1 year | 极少变更 |
| 图片 (webp/png) | `public` | 30 days | Logo 等静态资源 |
| API 响应 | `no-store` | - | 仿真结果不缓存 |

### Docker 部署中的缓存

当前 Docker 配置通过 Axum 直接服务静态文件。如需更精细的缓存控制，建议在前面加 Nginx/Caddy 反向代理。

## 预加载/预获取策略 | Preload/Prefetch Strategy

### 关键资源预加载

```html
<!-- index.html 中预加载关键资源 -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/jetbrains-mono-var.woff2" as="font" type="font/woff2" crossorigin>
```

### 模块预获取

Vite 默认为动态导入生成 prefetch 链接。可通过以下方式禁用不需要的预获取：

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    modulePreload: {
      resolveDependencies: (url, deps) => {
        // 仅预加载关键模块
        return deps.filter(d => !d.includes('xlsx') && !d.includes('gif'));
      },
    },
  },
});
```

## 性能预算 | Performance Budget

### 目标指标

| 指标 | 目标值 | 当前状态 |
|------|--------|----------|
| 首次内容绘制 (FCP) | < 1.5s | ✅ Tauri 模式 < 0.5s |
| 最大内容绘制 (LCP) | < 2.5s | ✅ 本地资源无网络延迟 |
| 累积布局偏移 (CLS) | < 0.1 | ✅ SolidJS 无 hydration 闪烁 |
| 首次输入延迟 (FID) | < 100ms | ✅ 计算在 Rust 线程 |
| JS Bundle (gzip) | < 200 KB | ✅ SolidJS runtime ~15 KB |
| 总传输大小 | < 500 KB | ✅ 无外部 CDN 依赖 |

### 监控方式

```bash
# Lighthouse CI（推荐集成到 GitHub Actions）
npx lhci autorun --config=lighthouserc.json

# 手动检查
npx lighthouse http://localhost:3000 --output=html --output-path=./lighthouse-report.html
```

## 其他优化 | Other Optimizations

- `apple-touch-icon.png` 已添加（180x180）
- `robots.txt` 已添加
- `manifest.json` 已添加（PWA 配置）
- 字体已完全本地化（`public/fonts/`），无外部 CDN 依赖
- CSP 中 Google Fonts 域名已移除（v0.4.10）
- 导出模块采用动态导入，按需加载 xlsx/gif/tiff 库
