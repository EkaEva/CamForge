# CamForge 架构设计文档

> 本文档描述 CamForge 的系统架构、技术选型和模块设计。

## 一、系统概述

CamForge 是一款现代化的凸轮机构运动学模拟器，支持桌面应用和 Web 服务器双模式部署。采用 Tauri v2 + SolidJS 架构实现桌面应用，Axum + SolidJS 架构实现 Web 服务器。

### 部署模式

| 模式 | 技术栈 | 适用场景 |
|------|--------|----------|
| 桌面应用 | Tauri v2 + SolidJS | 个人使用、离线使用 |
| Web 服务器 | Axum + SolidJS | 团队协作、在线演示 |

### 核心功能

- 凸轮轮廓设计与可视化
- 运动规律计算与分析
- 压力角、曲率半径检测
- 动画演示
- 多格式数据导出

## 二、技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (SolidJS)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Components │  │   Stores    │  │     Services        │  │
│  │  (UI 层)    │  │  (状态管理) │  │  (业务逻辑)         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                          │                                   │
│                   API Adapter Layer                          │
│                    (自动检测环境)                             │
│                          ▼                                   │
│              ┌───────────┴───────────┐                       │
│              ▼                       ▼                       │
├──────────────────────┬──────────────────────────────────────┤
│  Desktop (Tauri IPC) │       Web (HTTP/REST API)            │
│                      │                                       │
│  ┌────────────────┐  │  ┌────────────────────────────────┐  │
│  │ camforge  │  │  │      camforge-server           │  │
│  │  (Tauri App)   │  │  │       (Axum Server)            │  │
│  └────────────────┘  │  └────────────────────────────────┘  │
│          │           │              │                        │
│          └───────────┴──────────────┘                        │
│                      ▼                                       │
├─────────────────────────────────────────────────────────────┤
│                  camforge-core (Shared Library)              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   motion    │  │   profile   │  │      geometry       │  │
│  │ (运动规律)  │  │  (轮廓计算) │  │     (几何分析)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 桌面框架 | Tauri | v2 | 跨平台桌面应用框架 |
| Web 框架 | Axum | 0.7 | HTTP API 服务器 |
| 前端 | SolidJS | 1.9 | 响应式 UI 框架 |
| 语言 | TypeScript | 5.6 | 类型安全 |
| 样式 | Tailwind CSS | 4.2 | 原子化 CSS |
| 后端 | Rust | 1.70+ | 高性能计算 |
| 数值计算 | ndarray | 0.15 | Rust 数组运算 |
| 并行计算 | rayon | 1.8 | Rust 并行处理 |

## 三、前端架构

### 3.1 目录结构

```
src/
├── components/          # UI 组件
│   ├── animation/       # 动画组件 (CamAnimation)
│   ├── charts/          # 图表组件 (MotionCurves, CurvatureChart, GeometryChart)
│   ├── controls/        # 控件组件 (NumberInput, Select, Toggle)
│   └── layout/          # 布局组件 (Sidebar, MainCanvas, TitleBar, StatusBar)
├── services/            # 业务服务层
│   ├── motion.ts        # 运动规律计算
│   └── gifEncoder.ts    # GIF 编码服务
├── stores/              # 状态管理
│   ├── simulation.ts    # 模拟状态
│   ├── settings.ts      # 设置状态
│   └── history.ts       # 历史记录（撤销/重做）
├── io/                  # I/O 抽象层
│   └── storage.ts       # localStorage 封装
├── i18n/                # 国际化
│   └── translations.ts  # 中英文翻译
├── constants/           # 常量定义
├── types/               # TypeScript 类型
└── utils/               # 工具函数
    ├── array.ts         # 数组操作
    ├── debounce.ts      # 防抖函数
    ├── tauri.ts         # Tauri API 封装
    └── chartDrawing.ts  # 图表绘制
```

### 3.2 状态管理

采用 SolidJS 的 `createSignal` 进行细粒度响应式状态管理：

```typescript
// 参数状态
export const [params, setParams] = createSignal<CamParams>(defaultParams);

// 模拟数据状态
export const [simulationData, setSimulationData] = createSignal<SimulationData | null>(null);

// 显示选项状态
export const [displayOptions, setDisplayOptions] = createSignal<DisplayOptions>(defaultDisplayOptions);
```

### 3.3 数据流

```
用户输入 → updateParam() → params Signal 变化
                              ↓
                         runSimulation()
                              ↓
                    Tauri IPC / 前端计算
                              ↓
                    setSimulationData()
                              ↓
                    UI 自动更新（响应式）
```

## 四、后端架构

### 4.1 Cargo Workspace 结构

项目采用 Cargo Workspace 管理多个 crate：

```
camforge/
├── Cargo.toml                    # Workspace 配置
├── crates/                       # Rust crates
│   ├── camforge-core/            # 共享核心库
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs            # 库入口
│   │       ├── motion.rs         # 运动规律计算
│   │       ├── profile.rs        # 轮廓计算
│   │       ├── geometry.rs       # 几何分析
│   │       ├── types.rs          # 类型定义
│   │       └── error.rs          # 错误类型
│   └── camforge-server/          # HTTP API 服务器
│       ├── Cargo.toml
│       └── src/
│           ├── main.rs           # 服务器入口
│           └── routes/           # API 路由
│               ├── simulate.rs   # 模拟 API
│               └── export.rs     # 导出 API
└── src-tauri/                    # Tauri 桌面应用
    ├── Cargo.toml
    └── src/
        ├── lib.rs                # 应用入口
        ├── main.rs               # 程序入口
        └── commands/             # Tauri 命令
            ├── simulation.rs     # 模拟命令
            └── export.rs         # 导出命令
```

### 4.2 camforge-core 核心库

共享核心库提供凸轮计算功能，供 Tauri 应用和 Web 服务器共同使用：

```rust
// motion.rs - 运动规律计算
pub fn compute_motion(law: MotionLaw, phi: f64, params: &CamParams) -> MotionResult;

// profile.rs - 轮廓计算
pub fn compute_profile(params: &CamParams) -> ProfileResult;

// geometry.rs - 几何分析
pub fn compute_geometry(params: &CamParams, profile: &ProfileResult) -> GeometryResult;
```

### 4.3 Tauri 命令（桌面应用）

```rust
#[tauri::command]
fn run_simulation(params: CamParams) -> SimulationData {
    // 调用 camforge-core
}

#[tauri::command]
fn export_dxf(filepath: String, data: SimulationData) -> Result<(), String> {
    // 导出 DXF 文件
}
```

### 4.4 HTTP API（Web 服务器）

```rust
// routes/simulate.rs
async fn simulate_handler(params: Json<CamParams>) -> Json<SimulationData> {
    // 调用 camforge-core
}

// routes/export.rs
async fn export_dxf_handler(data: Json<SimulationData>) -> Response {
    // 返回 DXF 文件
}
```

API 端点：
- `POST /api/simulate` - 运行模拟
- `POST /api/export/dxf` - 导出 DXF
- `POST /api/export/csv` - 导出 CSV
- `GET /health` - 健康检查

## 五、关键设计决策

### 5.1 前后端分离架构

项目采用前后端分离架构，支持双模式部署：

| 组件 | 桌面应用模式 | Web 服务器模式 |
|------|-------------|---------------|
| 前端 | SolidJS + Tauri | SolidJS（静态文件） |
| 后端 | Rust (Tauri) | Rust (Axum) |
| 通信 | Tauri IPC | HTTP REST API |
| 核心计算 | camforge-core | camforge-core |

### 5.2 API 适配层

前端通过 API 适配层自动检测运行环境，统一调用接口：

```typescript
// src/api/adapter.ts
export const api = {
  async simulate(params: CamParams): Promise<SimulationData> {
    if (isTauriEnv()) {
      // Tauri 环境：使用 IPC
      return invokeTauri<SimulationData>('run_simulation', { params });
    } else {
      // Web 环境：使用 HTTP API
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return response.json();
    }
  }
};
```

### 5.3 双环境支持

应用同时支持 Tauri 环境和纯浏览器环境：

```typescript
const isTauri = isTauriEnv();

if (isTauri) {
  // 使用 Rust 后端计算
  const data = await invokeTauri<SimulationData>('run_simulation', { params });
} else {
  // 使用 HTTP API 计算
  const data = await api.simulate(params);
}
```

### 5.3 响应式设计

- 使用 SolidJS 的细粒度响应式系统
- 参数变化自动触发重新计算
- 图表自动更新

### 5.4 错误处理

- 前端: ErrorBoundary 组件捕获渲染错误
- 后端: Rust Result 类型确保错误安全
- 输入校验: 参数验证函数

## 六、性能优化

### 6.1 计算优化

- Rust 后端使用 rayon 并行计算
- 前端使用 requestAnimationFrame 分批处理
- GIF 编码使用 Web Worker

### 6.2 渲染优化

- Canvas 高 DPI 支持
- 参数更新防抖
- 按需渲染

### 6.3 内存优化

- 大数组使用 reduce 替代展开运算符
- DPI 导出上限保护
- 及时清理 Worker

## 七、扩展性设计

### 7.1 运动规律扩展

新增运动规律只需：

1. 在 `camforge-core/src/types.rs` 的 `MotionLaw` 枚举中添加新值
2. 在 `camforge-core/src/motion.rs` 的 `compute_motion` 函数中添加计算逻辑
3. 更新 UI 选项

### 7.2 从动件类型扩展

当前支持尖底和滚子从动件，可扩展：

- 平底从动件
- 摆动从动件

### 7.3 导出格式扩展

导出模块采用策略模式，易于添加新格式：

```typescript
export function generateDXF(data: SimulationData): string { ... }
export function generateCSV(data: SimulationData): string { ... }
export function generateSVG(data: SimulationData): string { ... }
```

## 八、部署架构

### 8.1 桌面应用部署

```bash
# 构建
pnpm tauri build

# 输出位置
src-tauri/target/release/bundle/
├── msi/           # Windows 安装包
├── dmg/           # macOS 安装包
└── deb/           # Linux 安装包
```

### 8.2 Web 服务器部署

```bash
# Docker 部署
docker-compose up -d

# 或手动部署
pnpm build && cargo run -p camforge-server --release
```

Docker 配置：
- 多阶段构建，优化镜像大小
- 健康检查配置
- 静态文件服务

## 九、安全设计

### 9.1 输入验证

- 前端: 参数范围校验
- 后端: 文件路径验证

### 9.2 文件操作安全

- 使用 Tauri Dialog API 让用户选择保存位置
- 验证文件扩展名
- 防止路径遍历攻击

## 十、测试策略

### 10.1 前端测试

- Vitest 单元测试
- 运动规律计算测试
- 数组工具函数测试

### 10.2 后端测试

- Rust 内置测试框架
- camforge-core 单元测试（13 个测试）
- 运动规律计算测试
- 几何计算测试

### 10.3 CI/CD

- GitHub Actions 自动化测试
- 跨平台构建
- 自动发布
