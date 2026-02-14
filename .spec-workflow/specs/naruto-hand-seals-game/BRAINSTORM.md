# 火影结印游戏 - 头脑风暴

## 日期：2026-02-06

## 核心问题：什么让这个游戏"好玩"？

### 🎮 弹幕游戏的爽感来源

#### 1. **视觉冲击**
- ✨ 敌人快速移动（从屏幕右侧飞向玩家）
- ✨ 数量感（同时出现5-10个敌人）
- ✨ 技能特效（拖尾、粒子爆炸）
- ✨ 打击反馈（击中时的闪光、震动、音效）
- ✨ 连击效果（Combo数字放大动画）

#### 2. **节奏感**
- 🎵 敌人波次明确（第1波 → 第2波 → 第3波）
- 🎵 速度递增（越后面越快）
- 🎵 音乐节奏配合（BGM + 打击音效）
- 🎵 紧张感（查克拉不足时的警告）

#### 3. **操作爽快感**
- 🎯 瞬间反馈（手势 → 技能 → 击中）
- 🎯 技能多样性（5种基础技能 + 组合技）
- 🎯 策略选择（用火遁还是雷遁？）
- 🎯 风险回报（组合技更强但耗查克拉多）

---

## 🎯 游戏机制重新设计

### 核心循环：结印 → 蓄力 → 释放 → 击中 → 反馈

#### 阶段1：结印系统（手势识别）
```
用户做手势 → 识别为印记 → 显示在序列中 → 匹配忍术
```

**关键点**：
- 结印和释放是**两个独立流程**
- 可以预先结印储备（最多3个印记）
- 错误的印记可以取消重来

#### 阶段2：技能释放系统
```
按空格键/点击 → 消耗查克拉 → 发射忍术弹丸 → 飞向敌人
```

**关键点**：
- 忍术有飞行动画（不是瞬移）
- 不同忍术速度不同
- 自动瞄准最近的敌人

#### 阶段3：碰撞和反馈系统
```
忍术击中敌人 → 伤害计算 → 爆炸特效 → 分数增加 → Combo累加
```

**关键点**：
- 击中瞬间有粒子爆炸
- 敌人受伤时颜色闪烁
- 消灭时有爆炸音效
- 分数跳动动画

---

## 🚀 技术特效设计

### 1. 忍术飞行轨迹效果

#### 火遁 🔥
- **视觉**：红色火球 + 橙色拖尾粒子
- **轨迹**：直线飞行，速度快
- **击中**：爆炸成10个火星散开

#### 水遁 💧
- **视觉**：蓝色水球 + 水滴拖尾
- **轨迹**：波浪形前进
- **击中**：水花四溅

#### 雷遁 ⚡
- **视觉**：黄色电球 + 电弧闪烁
- **轨迹**：之字形快速移动
- **击中**：电光爆炸 + 屏幕闪白

#### 风遁 💨
- **视觉**：青绿色风刃 + 螺旋拖尾
- **轨迹**：旋转前进
- **击中**：风暴扩散

#### 土遁 🗿
- **视觉**：棕色岩石 + 碎石拖尾
- **轨迹**：抛物线飞行
- **击中**：碎石飞溅

#### 火雷爆发 💥
- **视觉**：红黄混合 + 双色螺旋
- **轨迹**：加速直线
- **击中**：范围爆炸（伤害半径内所有敌人）

### 2. 敌人设计

#### 基础敌人（第1-3波）
```javascript
{
  speed: 2,          // 单位/秒
  health: 1,         // 一击必杀
  color: 'gray',
  spawnRate: 2,      // 每2秒生成1个
  maxCount: 4        // 同时最多4个
}
```

#### 进阶敌人（第4-6波）
```javascript
{
  speed: 3,
  health: 2,         // 需要2次攻击
  color: 'red',
  spawnRate: 1.5,    // 更快生成
  maxCount: 6
}
```

#### Boss敌人（第7波+）
```javascript
{
  speed: 1.5,        // 慢但血厚
  health: 10,
  color: 'purple',
  size: 3,           // 更大
  spawnRate: 10,     // 10秒生成1个
  maxCount: 1
}
```

---

## 🧪 TDD测试策略

### 测试金字塔

```
        /\
       /  \  E2E测试（游戏完整流程）
      /    \
     /      \
    /--------\ 集成测试（系统间交互）
   /          \
  /____________\ 单元测试（每个函数）
```

### 单元测试清单

#### 1. 手势识别测试
```typescript
describe('GestureDetection', () => {
  test('识别张开手掌为Open_Palm', () => {
    const landmarks = mockOpenPalmLandmarks();
    expect(detectNinjaSeal(landmarks)).toBe('Open_Palm');
  });

  test('映射Open_Palm到火印', () => {
    expect(getSealType('Open_Palm')).toBe('火印');
  });
});
```

#### 2. 忍术系统测试
```typescript
describe('JutsuSystem', () => {
  test('火印释放火遁', () => {
    const seals = ['火印'];
    const jutsu = matchJutsu(seals);
    expect(jutsu.name).toBe('火遁·豪火球之术');
  });

  test('查克拉不足无法释放', () => {
    const gameState = { chakra: 10 };
    const jutsu = { cost: 20 };
    expect(canCastJutsu(gameState, jutsu)).toBe(false);
  });

  test('释放后清空印记序列', () => {
    const seals = ['火印'];
    const newSeals = castJutsu(seals);
    expect(newSeals).toEqual([]);
  });
});
```

#### 3. 碰撞检测测试
```typescript
describe('CollisionDetection', () => {
  test('忍术距离<1时判定击中', () => {
    const jutsu = { position: new Vector3(5, 0, 0) };
    const enemy = { position: new Vector3(5.5, 0, 0) };
    expect(isColliding(jutsu, enemy)).toBe(true);
  });

  test('击中后敌人扣血', () => {
    const enemy = { health: 3 };
    const jutsu = { damage: 1 };
    const newHealth = applyDamage(enemy, jutsu);
    expect(newHealth).toBe(2);
  });
});
```

#### 4. 敌人生成测试
```typescript
describe('EnemySpawner', () => {
  test('每2秒生成1个敌人', () => {
    const spawner = new EnemySpawner({ interval: 2 });
    spawner.update(2.1);
    expect(spawner.shouldSpawn()).toBe(true);
  });

  test('最多同时4个敌人', () => {
    const spawner = new EnemySpawner({ maxCount: 4 });
    expect(spawner.canSpawn([1,2,3,4])).toBe(false);
  });

  test('敌人从右侧生成', () => {
    const enemy = createEnemy();
    expect(enemy.position.x).toBeGreaterThan(10);
  });
});
```

#### 5. 计分系统测试
```typescript
describe('ScoreSystem', () => {
  test('击杀敌人得100分', () => {
    let score = 0;
    score = addKillScore(score);
    expect(score).toBe(100);
  });

  test('Combo×2时分数翻倍', () => {
    let score = 0;
    const combo = 2;
    score = addKillScore(score, combo);
    expect(score).toBe(200);
  });

  test('3秒无击中Combo归零', () => {
    let combo = 5;
    combo = decayCombo(combo, 3.1);
    expect(combo).toBe(0);
  });
});
```

#### 6. 特效系统测试
```typescript
describe('VFXSystem', () => {
  test('创建拖尾粒子（20个）', () => {
    const trail = createTrailParticles(new Vector3(0,0,0));
    expect(trail.length).toBe(20);
  });

  test('爆炸时创建15个粒子', () => {
    const explosion = createExplosion(new Vector3(5,0,0));
    expect(explosion.particles.length).toBe(15);
  });

  test('粒子1秒后自动消失', () => {
    const particle = { lifespan: 1.0 };
    const alive = updateParticle(particle, 1.1);
    expect(alive).toBe(false);
  });
});
```

---

## 🎮 游戏流程重构

### 改进前 vs 改进后

| 方面 | 改进前 ❌ | 改进后 ✅ |
|------|----------|----------|
| **结印** | 识别后立即释放 | 识别后储备，按键释放 |
| **敌人** | 随机慢速移动 | 从右到左快速飞行 |
| **技能** | 瞬间击中 | 有飞行动画和拖尾 |
| **反馈** | 无明显反馈 | 爆炸+音效+分数动画 |
| **测试** | 仅手动测试 | TDD单元测试全覆盖 |

---

## 📋 新的开发任务清单

### Phase 1: 测试基础设施（TDD准备）
1. 安装Vitest测试框架
2. 配置测试环境
3. 创建Mock数据生成器

### Phase 2: 核心系统（测试先行）
4. 手势识别系统（先写测试）
5. 印记序列管理（先写测试）
6. 忍术匹配系统（先写测试）
7. 查克拉系统（先写测试）

### Phase 3: 战斗系统（测试先行）
8. 敌人生成器（先写测试）
9. 忍术发射系统（先写测试）
10. 碰撞检测（先写测试）
11. 伤害计算（先写测试）

### Phase 4: 视觉特效（测试先行）
12. 拖尾粒子系统（先写测试）
13. 爆炸特效（先写测试）
14. 击中反馈（先写测试）

### Phase 5: UI和反馈（测试先行）
15. 计分系统（先写测试）
16. Combo系统（先写测试）
17. 分数动画（先写测试）

### Phase 6: 测试代码工具
18. 技能自动释放器（用于测试）
19. 敌人波次控制器（用于测试）
20. 游戏场景调试器（用于测试）

---

## 🎯 成功指标

### 核心指标
- [ ] 敌人从右到左飞行速度 ≥ 5 units/秒
- [ ] 技能释放有明显飞行轨迹（持续0.5-1秒）
- [ ] 每个技能都有拖尾粒子（≥10个）
- [ ] 击中时有爆炸特效（≥15个粒子）
- [ ] 分数系统有动画反馈
- [ ] Combo×5时有视觉强化

### 测试覆盖率
- [ ] 单元测试覆盖率 ≥ 80%
- [ ] 每个核心函数都有测试用例
- [ ] 边界情况全覆盖
- [ ] 集成测试通过

### 游戏体验
- [ ] 操作流畅（<100ms延迟）
- [ ] 视觉爽快（特效明显）
- [ ] 打击感强（音效+震动）
- [ ] 有明确的进度感（波次系统）

---

## 🚀 下一步行动

1. ✅ 完成本头脑风暴文档
2. ⏳ 更新requirements.md（加入新需求）
3. ⏳ 更新design.md（重新设计架构）
4. ⏳ 创建新tasks.md（TDD任务清单）
5. ⏳ 安装Vitest测试框架
6. ⏳ 开始红绿重构循环

---

**头脑风暴结论**：

当前游戏缺少：
1. 🎮 弹幕游戏的速度感和数量感
2. ✨ 技能特效（拖尾、爆炸）
3. 🎯 打击反馈（视觉、听觉）
4. 🧪 TDD测试覆盖

**核心改进方向**：
- 从"慢节奏防守"变为"快节奏弹幕"
- 从"功能实现"变为"体验优化"
- 从"手动测试"变为"TDD驱动"
- 从"单一流程"变为"结印+释放分离"

---

**文档版本**：v2.0
**最后更新**：2026-02-06
**状态**：✅ 头脑风暴完成，准备进入需求更新阶段
