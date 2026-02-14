# 代码风格和约定

## 语言
- 代码注释使用中文
- 变量和函数名使用英文camelCase
- 类型和接口使用英文PascalCase

## TypeScript约定
- 严格类型检查
- 使用接口定义数据结构
- 避免使用any类型

## 文件组织
- `/src/types/` - 类型定义
- `/src/systems/` - 游戏系统逻辑
- `/src/services/` - 服务层(成就、音频等)
- `/src/components/` - React组件

## 命名约定
- 接口: PascalCase (如 GameState, Enemy)
- 函数: camelCase (如 createEnemy, matchJutsu)
- 常量: camelCase或UPPER_SNAKE_CASE
- 组件: PascalCase (如 GameScene)

## 版本号规范
- 格式: MAJOR.MINOR.PATCH (如 1.40.0)
- 每个版本更新需要在 version.ts 中更新VERSION和VERSION_HISTORY
