# 火影结印游戏 (Naruto Seals Game) - 项目概览

## 项目目的
这是一个基于React + Three.js的手势控制火影忍者主题游戏。玩家通过摄像头识别手势来结印释放忍术，消灭敌人。

## 技术栈
- **前端框架**: React 19 + TypeScript
- **3D引擎**: Three.js + React Three Fiber
- **构建工具**: Vite
- **样式**: TailwindCSS 4
- **手势识别**: MediaPipe Tasks Vision
- **测试**: Vitest + Testing Library

## 核心游戏系统

### 1. 手势系统 (gestureService.ts)
- 使用MediaPipe识别手势
- 5种手印类型: 火印、水印、雷印、风印、土印
- 手势映射: Open_Palm→火印, Closed_Fist→水印, Pointing_Up→雷印, Thumb_Up→风印, Victory→土印

### 2. 忍术系统 (jutsuSystem.ts)
- 9种预定义忍术（5种基础 + 4种组合）
- 3种效果类型: projectile(投射), area(范围), shield(护盾)
- 忍术属性: 查克拉消耗、冷却时间、伤害、颜色

### 3. 敌人生成系统 (enemySpawner.ts)
- 波次系统，5个预定义波次 + 无限波次
- 敌人属性: 位置、速度、血量、大小
- 波次5为Boss波次

### 4. 成就系统 (achievementService.ts)
- 19种成就定义
- 玩家统计: 总分、最大连击、最大波次、敌人击杀等

### 5. 视觉效果系统 (vfxSystem.ts)
- 粒子特效
- 爆炸效果

## 当前版本
- 版本号: 1.40.0
- 版本名: 忍者之道
