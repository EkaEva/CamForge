# 贡献指南 | Contributing Guide

感谢您有兴趣为 CamForge 做出贡献！

Thank you for your interest in contributing to CamForge!

## 目录 | Table of Contents

- [行为准则](#行为准则--code-of-conduct)
- [如何贡献](#如何贡献--how-to-contribute)
- [开发环境设置](#开发环境设置--development-setup)
- [项目结构](#项目结构--project-structure)
- [代码规范](#代码规范--coding-standards)
- [提交规范](#提交规范--commit-guidelines)
- [Pull Request 流程](#pull-request-流程)

---

## 行为准则 | Code of Conduct

请阅读并遵守我们的行为准则。我们致力于提供友好、安全和受欢迎的环境。

---

## 如何贡献 | How to Contribute

### 报告 Bug | Reporting Bugs

如果您发现了 Bug，请通过 [GitHub Issues](https://github.com/EkaEva/CamForge/issues) 提交报告。

提交 Bug 报告时，请包含：

1. **问题描述**：清晰简洁地描述问题
2. **复现步骤**：详细的复现步骤
3. **预期行为**：您期望发生什么
4. **实际行为**：实际发生了什么
5. **截图**：如果适用，添加截图
6. **环境信息**：操作系统、版本等

### 建议新功能 | Suggesting Features

我们欢迎新功能建议！请在 Issue 中详细描述：

1. 功能描述
2. 使用场景
3. 可能的实现方式

### 提交代码 | Submitting Code

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 开发环境设置 | Development Setup

### 环境要求 | Prerequisites

- **Node.js** 18.0 或更高版本
- **pnpm** 8.0 或更高版本
- **Rust** 1.70 或更高版本
- **Windows 10/11**、**macOS** 或 **Linux**

### 安装步骤 | Installation Steps

```bash
# 克隆仓库
git clone https://github.com/EkaEva/CamForge.git
cd CamForge

# 安装前端依赖
pnpm install

# 开发模式运行
pnpm tauri dev
```

### 构建发布版本 | Build for Production

```bash
pnpm tauri build
```

构建产物位于 `src-tauri/target/release/bundle/` 目录。

---

## 项目结构 | Project Structure

```
camforge/
├── crates/                    # Rust crates
│   ├── camforge-core/         # 共享核心库
│   │   └── src/
│   │       ├── motion.rs      # 运动规律计算
│   │       ├── profile.rs     # 轮廓计算
│   │       ├── geometry.rs    # 几何分析
│   │       └── types.rs       # 类型定义
│   └── camforge-server/       # HTTP API 服务器
│       └── src/
│           ├── main.rs        # 服务器入口
│           └── routes/        # API 路由
├── src/                       # 前端源码
│   ├── components/            # UI 组件
│   ├── services/              # 业务服务层
│   ├── stores/                # 状态管理
│   ├── api/                   # API 适配层
│   ├── io/                    # I/O 抽象层
│   ├── i18n/                  # 国际化
│   ├── constants/             # 常量定义
│   ├── types/                 # 类型定义
│   └── utils/                 # 工具函数
├── src-tauri/                 # Tauri 桌面应用
│   ├── src/
│   │   ├── lib.rs             # 应用入口
│   │   └── commands/          # Tauri 命令
│   └── tauri.conf.json        # Tauri 配置
├── docs/                      # 文档
└── public/                    # 静态资源
```

详细架构说明请参阅 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。

---

## 代码规范 | Coding Standards

### TypeScript / SolidJS

- Use TypeScript strict mode (configured in `tsconfig.json`)
- Add type annotations for all exported functions
- Avoid `any` type (ESLint warns on `@typescript-eslint/no-explicit-any`)
- Use `const` and `let`, never `var` (ESLint enforces `prefer-const`)
- SolidJS-specific rules enforced by `eslint-plugin-solid`:
  - No React-specific props (`solid/no-react-specific-props`: error)
  - Prefer `<For>` over `.map()` for reactive lists (`solid/prefer-for`: warn)
  - No destructuring of props (`solid/no-destructure`: warn)
  - Reactivity tracking (`solid/reactivity`: warn)

### Rust

- Follow Rust standard naming conventions (snake_case for functions/variables, CamelCase for types)
- Run `cargo clippy` — CI treats warnings as errors (`-D warnings`)
- Add doc comments (`///`) for all public functions and types
- Use `Result<T, String>` for error handling in `camforge-core` (consistent with current codebase)

### Code Style | 代码风格

Formatting is enforced by Prettier (frontend) and `cargo fmt` (Rust). Configuration:

**Prettier** (`.prettierrc`):

| Option | Value |
|--------|-------|
| Semi-colons | Always (`semi: true`) |
| Quotes | Single (`singleQuote: true`) |
| Trailing commas | All (`trailingComma: 'all'`) |
| Print width | 100 (`printWidth: 100`) |
| Tab width | 2 spaces (`tabWidth: 2`) |
| Arrow parens | Always (`arrowParens: 'always'`) |
| Line endings | LF (`endOfLine: 'lf'`) |

**ESLint** (`eslint.config.js`):

- Base: `@eslint/js` recommended + `typescript-eslint` recommended
- SolidJS: `eslint-plugin-solid` (TypeScript config)
- Formatting: `eslint-config-prettier` (disables formatting rules that conflict with Prettier)
- Key rules: `no-console` warns (allow `warn`/`error`), unused vars with `_` prefix allowed

**Naming Conventions**:

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `CamAnimation`, `NumberInput` |
| Functions / variables | camelCase | `computeMotion`, `simulationData` |
| Constants | UPPER_SNAKE_CASE | `MAX_DPI`, `EPSILON` |
| TypeScript types / interfaces | PascalCase | `CamParams`, `SimulationData` |
| Rust functions | snake_case | `compute_rise`, `compute_profile` |
| Rust types / structs | CamelCase | `CamParams`, `ProfileResult` |

### Comment Conventions | 注释规范

```typescript
/**
 * 计算运动规律 | Compute motion law values
 * @param law - 运动规律类型 (Motion law type)
 * @param t - 归一化时间 0-1 (Normalized time)
 * @param h - 行程 mm (Stroke)
 * @param omega - 角速度 rad/s (Angular velocity)
 * @param deltaRad - 运动角 rad (Motion angle)
 * @returns [位移, 速度, 加速度] (displacement, velocity, acceleration)
 */
export function computeMotion(
  law: MotionLaw,
  t: number,
  h: number,
  omega: number,
  deltaRad: number
): [number, number, number]
```

- Prefer bilingual comments (English primary, Chinese secondary) for public APIs
- Use JSDoc for all exported functions and types (current coverage is low — contributions to improve this are welcome)

### Enforcement | 代码规范强制执行

All style and quality rules are enforced through automated checks:

**CI Checks** (`.github/workflows/test.yml`):

| Check | Command | Blocking |
|-------|---------|----------|
| Frontend tests | `pnpm test:run` | Yes (fails CI) |
| TypeScript type check | `pnpm tsc --noEmit` | Yes |
| ESLint | `pnpm lint` | Yes (warnings allowed) |
| Prettier format check | `pnpm format:check` | Recommended before PR |
| Rust tests | `cargo test -p camforge-core -p camforge-server` | Yes |
| Rust clippy | `cargo clippy -p camforge-core -p camforge-server -- -D warnings` | Yes |
| Rust formatting | `cargo fmt --check` | Recommended before PR |
| Dependency audit | `cargo audit` + `pnpm audit` | Advisory (non-blocking) |

**Pre-commit Hooks** (recommended setup):

```bash
# Install lefthook or husky, then configure:
# Frontend
pnpm format          # Auto-fix formatting
pnpm lint:fix        # Auto-fix lint issues

# Backend
cargo fmt            # Auto-fix Rust formatting
cargo clippy --fix   # Auto-fix clippy issues
```

A pre-commit hook configuration is planned but not yet set up. In the meantime, run these commands manually before committing:

```bash
pnpm format && pnpm lint && cargo fmt && cargo clippy -p camforge-core -p camforge-server
```

---

### Store 组织

- 单文件 store 保持扁平（<200 行），如 `settings.ts`、`history.ts`
- 超过 200 行的 store 拆分为子目录并使用 `index.ts` barrel 导出，如 `simulation/`

### 目录职责边界

- `api/` — 传输适配层（HTTP/Tauri IPC 报文封装）
- `services/` — 重量级计算操作（纯函数，如 `motion.ts`）
- `exporters/` — 文件格式导出逻辑（DXF, CSV, SVG 等）
- `utils/` — 轻量级工具函数（数组、防抖、平台检测等）
- `constants/` — 全局常量（数值、颜色、默认参数等）

### 导入约定

- 优先从 `index.ts` barrel 导入
- 当 barrel 未导出所需符号或 tree-shaking 关键时，允许直接文件导入

### 测试目录

- `src/test/` — 测试基础设施（setup.ts, mocks）
- `__tests__/` — 实际测试文件，与源码同位置放置
- E2E 测试使用 `.spec.ts` 后缀，放在 `e2e/` 目录

### Web Workers

- Web Workers 放置在 `src/workers/`，使用 `tiffWorker.ts` 命名模式

### 静态资源

- 静态资源统一放置在 `public/`，不在 `src/assets/` 中

### 注释语言

- JSDoc 必须双语（英文为主，中文为辅）
- 内联注释可任选语言
- Rust 验证消息使用英文（供 API 消费者）
- 用户可见字符串走 i18n 系统

### 导出风格

- 统一使用 named exports，不使用 `export default`

## 提交规范 | Commit Guidelines

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 (type)

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

### 示例

```
feat(motion): add 4-5-6-7 polynomial motion law

Add support for 4-5-6-7 polynomial motion law which provides
continuous jerk for ultra-high-speed applications.

Closes #123
```

---

## Pull Request 流程

1. **确保测试通过**：运行 `pnpm test` 确保所有测试通过
2. **更新文档**：如有必要，更新 README 和相关文档
3. **添加测试**：为新功能添加测试用例
4. **描述更改**：在 PR 描述中详细说明更改内容

### PR 检查清单

- [ ] 代码遵循项目规范
- [ ] 所有测试通过
- [ ] 新功能有对应测试
- [ ] 文档已更新
- [ ] 提交信息符合规范

---

## 许可证 | License

本项目采用 MIT 许可证。提交代码即表示您同意您的贡献将在相同许可证下发布。

---

## 联系方式 | Contact

如有问题，请通过 GitHub Issues 联系我们。

感谢您的贡献！Thank you for your contribution!