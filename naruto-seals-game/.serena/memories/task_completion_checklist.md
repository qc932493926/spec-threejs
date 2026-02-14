# 任务完成检查清单

## 每次代码修改后
1. 运行类型检查：`npm run build`（包含TypeScript检查）
2. 运行lint检查：`npm run lint`
3. 运行相关测试：`npm run test:run`

## 完成功能后
1. 确保所有测试通过
2. 确保lint无错误
3. 确保构建成功
4. 提交代码：`git commit -m "vXX: 功能描述"`

## 版本发布前
1. 更新 `src/version.ts` 中的版本号
2. 运行完整测试套件
3. 构建生产版本
4. 提交并打标签

## 性能优化检查
1. 检查useMemo/useCallback使用
2. 检查React组件重渲染
3. 检查Three.js对象池使用
4. 检查内存泄漏（useEffect清理）

## 代码审查要点
1. 类型安全
2. 代码可读性
3. 性能影响
4. 错误处理
