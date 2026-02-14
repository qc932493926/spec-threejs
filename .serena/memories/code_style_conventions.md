# 代码风格和约定

## TypeScript约定
- 严格模式：启用TypeScript严格模式
- 类型定义：在 `src/types/index.ts` 中集中定义类型
- 接口命名：使用PascalCase（如 `GameState`, `Jutsu`）
- 函数命名：使用camelCase（如 `detectNinjaSeal`, `matchJutsu`）

## React约定
- 函数组件：使用函数组件和Hooks
- 组件命名：PascalCase（如 `GameScene`, `EnemyMesh`）
- Props接口：每个组件定义对应的Props接口（如 `GameSceneProps`）

## 文件命名
- 组件文件：PascalCase（如 `GameScene.tsx`）
- 服务文件：camelCase（如 `gestureService.ts`）
- 系统文件：camelCase（如 `jutsuSystem.ts`）

## 注释语言
- 代码注释：中文
- 类型定义：中文字段名（如手印类型：火印、水印等）

## ESLint规则
- 使用ESLint推荐规则
- React Hooks规则
- React Refresh规则
- TypeScript推荐规则

## 样式约定
- 使用Tailwind CSS
- 使用glass-panel类实现毛玻璃效果
- 使用渐变色和动画效果

## 项目特定模式
- 游戏系统使用类实现（如 `EnemySpawner`, `SmoothFilter`）
- React组件使用函数式组件和Hooks
- 使用useRef管理Three.js对象引用
- 使用useFrame进行帧更新
