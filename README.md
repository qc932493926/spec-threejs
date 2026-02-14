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

**在线预览**: (即将部署)

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
