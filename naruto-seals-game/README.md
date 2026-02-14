<<<<<<< HEAD
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
=======
# Spec Three.js 项目集合

AI Agents 工作空间，包含 Three.js 相关的项目和文档。

## 📁 项目结构

```
spec-threejs/
├── docs/                    # 文档目录
│   ├── 技术分析文档.md
│   ├── 技能系统综合分析与主技能设计.md
│   └── ...
│
├── threejs_demo/           # Three.js 基础演示项目
│   ├── src/                # 源代码
│   ├── css/                # 样式文件
│   ├── index.html          # 入口文件
│   └── package.json        # 项目配置
│
├── naruto-seals-game/      # 火影忍者结印游戏
│   ├── src/                # 源代码
│   └── package.json        # 项目配置
│
└── .agents/                # AI Agent 技能配置
    └── skills/             # 已安装的技能
        ├── brainstorming/
        ├── gh-pages-deploy/
        ├── vercel-deploy/
        ├── threejs-animation/
        ├── threejs-game/
        └── ...
```

## 🚀 子项目

### 1. Three.js Demo
一个简单的 Three.js 演示项目，展示旋转的 3D 立方体。

**在线预览**: https://qc932493926.github.io/threejs_demo

**本地运行**:
```bash
cd threejs_demo
npm install
npm run dev
```

**部署到 GitHub Pages**:
```bash
cd threejs_demo
npm run deploy
```

### 2. Naruto Seals Game
火影忍者结印识别游戏，基于 Three.js + MediaPipe 手势识别。

**本地运行**:
```bash
cd naruto-seals-game
npm install
npm run dev
```

## 🛠️ 已安装的技能

- **brainstorming** - 头脑风暴工具
- **gh-pages-deploy** - GitHub Pages 部署
- **vercel-deploy** - Vercel 部署
- **threejs-animation** - Three.js 动画
- **threejs-game** - Three.js 游戏开发
- **threejs-shaders** - Three.js 着色器
- **hand-gesture-recognition** - 手势识别
- **particle-systems** - 粒子系统
- **web-audio-api** - Web Audio API
- 以及更多...

## 📝 文档

查看 [docs/](docs/) 目录获取详细的技术文档和分析。

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！

## 📄 许可证

MIT
>>>>>>> c8be82405561e9b61b8f7e0d7bb232eec51d94fa
