# Requirements v2.0: Naruto Hand Seals Game (TDD Enhanced)

## 变更日志

**v2.0 (2026-02-06)**:
- ✅ 加入TDD测试需求（Epic 7）
- ✅ 重构敌人系统为弹幕式（Epic 3更新）
- ✅ 加入技能特效系统（Epic 8）
- ✅ 加入测试工具系统（Epic 9）
- ✅ 分离结印和释放流程（Epic 2更新）

**v1.0**: 初始版本

---

## Overview

A browser-based 3D action game where players use real-world hand gestures (captured via webcam) to perform Naruto-style ninja seals and cast jutsu techniques to defeat enemies. **v2.0强化了弹幕游戏的爽快感和TDD测试覆盖。**

**Target Audience**: Naruto fans, casual gamers, users interested in gesture-based gaming

**Platform**: Web browser (desktop, requires webcam)

**Core Value Proposition**:
- v1: Immersive gesture-based gameplay
- v2: **+ 弹幕游戏的爽快感 + TDD质量保证**

---

## Epic Overview

| Epic | 标题 | 优先级 | 变更 |
|------|------|--------|------|
| Epic 1 | 手势识别系统 | P0 | - |
| Epic 2 | 忍术系统（结印+释放） | P0 | **✅ v2: 分离流程** |
| Epic 3 | 敌人与战斗系统 | P0 | **✅ v2: 弹幕式** |
| Epic 4 | 评分与进阶系统 | P1 | **✅ v2: 强化反馈** |
| Epic 5 | 音频与视觉反馈 | P1 | **✅ v2: 加入特效** |
| Epic 6 | UI与游戏流程 | P1 | - |
| Epic 7 | **TDD测试系统** | **P0** | **🆕 v2: 新增** |
| Epic 8 | **技能特效系统** | **P1** | **🆕 v2: 新增** |
| Epic 9 | **测试工具系统** | **P2** | **🆕 v2: 新增** |

---

## User Stories

### Epic 1: 手势识别系统（保持不变）

#### US-1.1: Hand Gesture Detection
**As a** player
**I want** the game to accurately detect my hand gestures via webcam
**So that** I can perform ninja seals naturally without keyboard/mouse

**Acceptance Criteria**:
- [ ] Game requests webcam permission on launch
- [ ] Hand landmarks are tracked and displayed on video feed
- [ ] System recognizes 5 distinct hand gestures:
  - Open Palm (✋) → Fire Seal
  - Closed Fist (✊) → Water Seal
  - Pointing Up (☝️) → Thunder Seal
  - Thumbs Up (👍) → Wind Seal
  - Victory/Peace (✌️) → Earth Seal
- [ ] Gesture detection has <300ms latency（v2: 从500ms提升到300ms）
- [ ] Visual feedback shows detected gesture

**Given** player shows open palm to camera
**When** system processes video frame
**Then** Fire Seal is detected and displayed
**And** corresponding seal icon appears in UI

**Test Case**:
```typescript
test('detectNinjaSeal returns Open_Palm for open hand', () => {
  const landmarks = mockOpenPalmLandmarks();
  expect(detectNinjaSeal(landmarks)).toBe('Open_Palm');
});
```

#### US-1.2: Gesture Cooldown
**As a** player
**I want** a short cooldown between gesture recognitions
**So that** accidental gestures don't trigger unintended seals

**Acceptance Criteria**:
- [ ] 500ms cooldown between seal detections
- [ ] Same gesture repeated quickly is ignored
- [ ] Different gestures can be inputted immediately

**Test Case**:
```typescript
test('gesture within cooldown period is ignored', () => {
  const detector = new GestureDetector({ cooldown: 500 });
  detector.detect('Open_Palm', 0);
  const result = detector.detect('Open_Palm', 200); // 200ms later
  expect(result).toBe(null);
});
```

---

### Epic 2: 忍术系统（✅ v2重构：分离结印和释放）

#### US-2.1: 印记序列管理
**As a** player
**I want** to build up a sequence of seals before releasing jutsu
**So that** I have strategic control over when to attack

**Acceptance Criteria**:
- [ ] Can store up to 3 seals in sequence
- [ ] Each seal appears in sequence display
- [ ] Can clear sequence with Escape key
- [ ] Wrong seal can be removed with Backspace

**Given** player performs Fire Seal gesture
**When** gesture is detected
**Then** Fire Seal icon is added to sequence display
**And** ready indicator shows "Ready to cast"

**Test Case**:
```typescript
test('add seal to sequence', () => {
  const sequence = new SealSequence();
  sequence.add('火印');
  expect(sequence.getSeals()).toEqual(['火印']);
  expect(sequence.length()).toBe(1);
});

test('max 3 seals in sequence', () => {
  const sequence = new SealSequence({ maxLength: 3 });
  sequence.add('火印');
  sequence.add('水印');
  sequence.add('雷印');
  sequence.add('风印'); // 应该被忽略
  expect(sequence.length()).toBe(3);
});
```

#### US-2.2: 忍术释放机制
**As a** player
**I want** to manually trigger jutsu release
**So that** I can time my attacks strategically

**Acceptance Criteria**:
- [ ] Press Space or Click to release jutsu
- [ ] Chakra is consumed on release (not on seal detection)
- [ ] Sequence is cleared after successful release
- [ ] Cannot release if chakra insufficient

**Given** player has Fire Seal in sequence and 100 chakra
**When** player presses Space key
**Then** Fire jutsu is launched
**And** 20 chakra is consumed
**And** sequence is cleared

**Test Case**:
```typescript
test('release jutsu consumes chakra', () => {
  const game = createGameState({ chakra: 100 });
  const jutsu = { cost: 20, name: '火遁' };
  const newState = releaseJutsu(game, jutsu);
  expect(newState.chakra).toBe(80);
});

test('cannot release with insufficient chakra', () => {
  const game = createGameState({ chakra: 10 });
  const jutsu = { cost: 20 };
  expect(canReleaseJutsu(game, jutsu)).toBe(false);
});
```

#### US-2.3: 6种忍术定义
**As a** player
**I want** 6 distinct jutsu techniques
**So that** I have variety in combat

**Jutsu List**:
1. 🔥 火遁·豪火球之术 (Fire Seal) - Cost: 15, Damage: 1, Speed: 8
2. 💧 水遁·水龙弹之术 (Water Seal) - Cost: 15, Damage: 1, Speed: 6
3. ⚡ 雷遁·千鸟 (Thunder Seal) - Cost: 20, Damage: 2, Speed: 12
4. 💨 风遁·螺旋手里剑 (Wind Seal) - Cost: 15, Damage: 1, Speed: 10
5. 🗿 土遁·土流壁 (Earth Seal) - Cost: 10, Damage: 0, Shield: true
6. 💥 火雷爆发 (Fire + Thunder) - Cost: 35, Damage: 3, AOE: 3

**Test Case**:
```typescript
test('match single seal to jutsu', () => {
  const jutsu = matchJutsu(['火印']);
  expect(jutsu.name).toBe('火遁·豪火球之术');
  expect(jutsu.damage).toBe(1);
});

test('match combo seals to jutsu', () => {
  const jutsu = matchJutsu(['火印', '雷印']);
  expect(jutsu.name).toBe('火雷爆发');
  expect(jutsu.damage).toBe(3);
  expect(jutsu.aoe).toBe(3);
});
```

---

### Epic 3: 敌人与战斗系统（✅ v2重构：弹幕式）

#### US-3.1: 弹幕式敌人生成
**As a** player
**I want** enemies to fly from right to left like a bullet hell game
**So that** the game feels fast-paced and exciting

**Acceptance Criteria**:
- [ ] Enemies spawn from right edge (x=15)
- [ ] Move towards left at speed 5-8 units/sec
- [ ] Multiple enemies on screen (5-10 simultaneously)
- [ ] Wave-based spawning (Wave 1, Wave 2, ...)
- [ ] Speed increases每波 (+1 unit/sec)

**Given** game wave 1 starts
**When** 2 seconds pass
**Then** 1 enemy spawns at x=15, y=random(-5 to 5)
**And** enemy moves left at 5 units/sec

**Test Case**:
```typescript
test('enemy spawns from right edge', () => {
  const enemy = createEnemy({ wave: 1 });
  expect(enemy.position.x).toBeGreaterThanOrEqual(14);
  expect(enemy.velocity.x).toBeLessThan(0); // moving left
});

test('enemy speed increases with wave', () => {
  const enemy1 = createEnemy({ wave: 1 });
  const enemy2 = createEnemy({ wave: 3 });
  expect(Math.abs(enemy2.velocity.x)).toBeGreaterThan(Math.abs(enemy1.velocity.x));
});

test('spawner creates enemy every 2 seconds', () => {
  const spawner = new EnemySpawner({ interval: 2, wave: 1 });
  spawner.update(2.1);
  expect(spawner.shouldSpawn()).toBe(true);
  const enemy = spawner.spawn();
  expect(enemy).toBeDefined();
});
```

#### US-3.2: 敌人波次系统
**As a** player
**I want** clear wave progression
**So that** I feel a sense of achievement

**Wave Configuration**:
```javascript
Wave 1: { enemyCount: 10, speed: 5, interval: 2, health: 1 }
Wave 2: { enemyCount: 15, speed: 6, interval: 1.5, health: 1 }
Wave 3: { enemyCount: 20, speed: 7, interval: 1.5, health: 2 }
Wave 4: { enemyCount: 25, speed: 8, interval: 1, health: 2 }
Boss Wave: { enemyCount: 1, speed: 2, interval: 10, health: 50, size: 5 }
```

**Test Case**:
```typescript
test('wave 1 configuration', () => {
  const wave = getWaveConfig(1);
  expect(wave.enemyCount).toBe(10);
  expect(wave.speed).toBe(5);
  expect(wave.health).toBe(1);
});

test('boss wave has high health', () => {
  const wave = getWaveConfig(5);
  expect(wave.health).toBeGreaterThan(20);
  expect(wave.size).toBeGreaterThan(3);
});
```

#### US-3.3: 碰撞检测
**As a** developer
**I want** reliable collision detection
**So that** hits register accurately

**Acceptance Criteria**:
- [ ] Collision when distance < 1 unit
- [ ] Jutsu deactivates after hit
- [ ] Enemy takes damage
- [ ] Hit triggers VFX and SFX

**Test Case**:
```typescript
test('collision when distance < 1', () => {
  const jutsu = { position: new Vector3(5, 0, 0) };
  const enemy = { position: new Vector3(5.5, 0, 0) };
  const distance = jutsu.position.distanceTo(enemy.position);
  expect(isColliding(jutsu, enemy, 1)).toBe(true);
});

test('apply damage on collision', () => {
  const enemy = { health: 3 };
  const jutsu = { damage: 1 };
  const newHealth = applyDamage(enemy, jutsu);
  expect(newHealth).toBe(2);
});

test('enemy destroyed when health <= 0', () => {
  const enemy = { health: 1 };
  const jutsu = { damage: 1 };
  const destroyed = shouldDestroyEnemy(enemy, jutsu);
  expect(destroyed).toBe(true);
});
```

---

### Epic 4: 评分与进阶系统（✅ v2强化反馈）

#### US-4.1: 计分系统
**As a** player
**I want** satisfying score feedback
**So that** I feel rewarded for my performance

**Acceptance Criteria**:
- [ ] Kill enemy: +100 points
- [ ] Combo multiplier: score × combo
- [ ] Perfect wave (no damage): +500 bonus
- [ ] Score animates on increase (number pops up)

**Test Case**:
```typescript
test('kill enemy adds 100 points', () => {
  let score = 0;
  score = addKillScore(score);
  expect(score).toBe(100);
});

test('combo multiplies score', () => {
  let score = 0;
  const combo = 3;
  score = addKillScore(score, combo);
  expect(score).toBe(300); // 100 × 3
});

test('perfect wave bonus', () => {
  const score = calculateWaveBonus({ damaged: false, wave: 1 });
  expect(score).toBe(500);
});
```

#### US-4.2: Combo系统
**As a** player
**I want** combo counter for consecutive hits
**So that** I'm incentivized to maintain accuracy

**Acceptance Criteria**:
- [ ] Combo starts at 0
- [ ] +1 for each enemy kill
- [ ] Resets to 0 after 3 seconds without hit
- [ ] Visual feedback at combo ≥ 5

**Test Case**:
```typescript
test('combo increments on kill', () => {
  let combo = 0;
  combo = incrementCombo(combo);
  expect(combo).toBe(1);
});

test('combo resets after 3 seconds', () => {
  const comboTimer = 3.1;
  const combo = updateCombo(5, comboTimer);
  expect(combo).toBe(0);
});

test('combo multiplier applies to score', () => {
  const baseScore = 100;
  const combo = 5;
  const finalScore = applyComboMultiplier(baseScore, combo);
  expect(finalScore).toBe(500);
});
```

---

### Epic 5: 音频与视觉反馈（✅ v2加入特效）

#### US-5.1: 音效系统
**As a** player
**I want** immersive sound effects
**So that** actions feel impactful

**Sound List**:
- Background Music (loop)
- Fire Seal (fire_seal.wav)
- Water Seal (water_seal.wav)
- Thunder Seal (thunder_seal.wav)
- Wind Seal (wind_seal.wav)
- Earth Seal (earth_seal.wav)
- Combo Jutsu (combo_jutsu.wav)
- Hit Sound (dynamic, pitch based on combo)
- Explosion (explosion.wav)

**Test Case**:
```typescript
test('play seal sound on detection', () => {
  const audioService = new AudioService();
  const playSpy = jest.spyOn(audioService, 'playSealSound');
  audioService.playSealSound('火印');
  expect(playSpy).toHaveBeenCalledWith('火印');
});

test('hit sound pitch increases with combo', () => {
  const audioService = new AudioService();
  const sound1 = audioService.createHitSound(1);
  const sound2 = audioService.createHitSound(5);
  expect(sound2.frequency).toBeGreaterThan(sound1.frequency);
});
```

---

### Epic 6: UI与游戏流程（保持不变，略）

---

### Epic 7: **🆕 TDD测试系统（v2新增）**

#### US-7.1: 单元测试覆盖
**As a** developer
**I want** comprehensive unit test coverage
**So that** refactoring is safe and bugs are caught early

**Acceptance Criteria**:
- [ ] All core functions have unit tests
- [ ] Test coverage ≥ 80%
- [ ] Tests run in < 5 seconds
- [ ] CI/CD integration ready

**Test Modules**:
```
src/services/gestureService.test.ts
src/services/audioService.test.ts
src/systems/jutsuSystem.test.ts
src/systems/enemySpawner.test.ts
src/systems/collisionDetection.test.ts
src/systems/scoreSystem.test.ts
src/systems/comboSystem.test.ts
src/systems/vfxSystem.test.ts
```

**Test Case**:
```typescript
describe('GestureService', () => {
  describe('detectNinjaSeal', () => {
    test('returns Open_Palm for open hand', () => { ... });
    test('returns Closed_Fist for closed fist', () => { ... });
    test('returns None for invalid landmarks', () => { ... });
  });

  describe('getSealType', () => {
    test('maps Open_Palm to 火印', () => { ... });
    test('maps Closed_Fist to 水印', () => { ... });
  });
});
```

#### US-7.2: 集成测试
**As a** developer
**I want** integration tests for system interactions
**So that** components work together correctly

**Test Scenarios**:
- [ ] Gesture → Seal → Jutsu → Launch → Hit → Score
- [ ] Enemy Spawn → Move → Collision → Destroy
- [ ] Combo Timer → Decay → Reset

**Test Case**:
```typescript
test('full combat flow', () => {
  const game = createGame();

  // 1. Detect gesture
  game.addSeal('火印');

  // 2. Release jutsu
  const jutsu = game.releaseJutsu();
  expect(jutsu.name).toBe('火遁');

  // 3. Spawn enemy
  const enemy = game.spawnEnemy();

  // 4. Simulate collision
  game.update(1); // 1 second
  expect(enemy.health).toBe(0);
  expect(game.score).toBe(100);
});
```

#### US-7.3: TDD工作流
**As a** developer
**I want** to follow TDD (Red-Green-Refactor)
**So that** code quality is high from the start

**TDD Process**:
1. **Red**: Write failing test first
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code while tests pass

**Example**:
```typescript
// Step 1: RED - Write failing test
test('calculate jutsu damage', () => {
  const jutsu = { baseDamage: 10 };
  const combo = 3;
  const damage = calculateDamage(jutsu, combo);
  expect(damage).toBe(30); // FAILS: calculateDamage not implemented
});

// Step 2: GREEN - Minimal implementation
function calculateDamage(jutsu, combo) {
  return jutsu.baseDamage * combo; // PASSES
}

// Step 3: REFACTOR - Improve
function calculateDamage(jutsu: Jutsu, combo: number): number {
  if (combo < 1) throw new Error('Invalid combo');
  return jutsu.baseDamage * Math.max(1, combo);
}
```

---

### Epic 8: **🆕 技能特效系统（v2新增）**

#### US-8.1: 忍术拖尾效果
**As a** player
**I want** jutsu to have visible flight trails
**So that** attacks feel visually impressive

**Acceptance Criteria**:
- [ ] Each jutsu has 10-20 trail particles
- [ ] Particles fade over 0.5 seconds
- [ ] Different colors per jutsu type
- [ ] Trail follows jutsu position

**Test Case**:
```typescript
test('create trail particles', () => {
  const jutsu = { position: new Vector3(5, 0, 0), type: '火遁' };
  const trail = createTrailParticles(jutsu);
  expect(trail.length).toBeGreaterThanOrEqual(10);
  expect(trail[0].color).toBe('#FF4500'); // Fire color
});

test('trail particles fade over time', () => {
  const particle = { opacity: 1.0, lifespan: 0.5 };
  updateParticle(particle, 0.3);
  expect(particle.opacity).toBeLessThan(1.0);
});

test('particles removed when lifespan ends', () => {
  const particles = [{ lifespan: 0.5, age: 0 }];
  const alive = updateParticles(particles, 0.6);
  expect(alive.length).toBe(0);
});
```

#### US-8.2: 爆炸特效
**As a** player
**I want** explosive visual feedback on hit
**So that** impacts feel satisfying

**Acceptance Criteria**:
- [ ] 15 explosion particles on impact
- [ ] Particles spread radially
- [ ] 1-second lifespan
- [ ] Color matches jutsu type

**Test Case**:
```typescript
test('create explosion particles', () => {
  const position = new Vector3(5, 0, 0);
  const explosion = createExplosion(position);
  expect(explosion.particles.length).toBe(15);
});

test('particles spread radially', () => {
  const explosion = createExplosion(new Vector3(0, 0, 0));
  const distances = explosion.particles.map(p => p.velocity.length());
  const allMoving = distances.every(d => d > 0);
  expect(allMoving).toBe(true);
});
```

#### US-8.3: 打击反馈
**As a** player
**I want** visual feedback when jutsu hits enemy
**So that** I know my attack landed

**Feedback Types**:
- Enemy flash white for 0.1 seconds
- Screen shake (intensity based on damage)
- Combo counter pops up
- Score number animates

**Test Case**:
```typescript
test('enemy flashes on hit', () => {
  const enemy = { color: '#808080' };
  const hitEnemy = applyHitEffect(enemy);
  expect(hitEnemy.color).toBe('#FFFFFF');

  // After 0.1 seconds
  const recoveredEnemy = updateHitEffect(hitEnemy, 0.1);
  expect(recoveredEnemy.color).toBe('#808080');
});

test('screen shake intensity', () => {
  const damage = 3;
  const shake = calculateScreenShake(damage);
  expect(shake.amplitude).toBeGreaterThan(0);
  expect(shake.duration).toBeLessThan(0.5);
});
```

---

### Epic 9: **🆕 测试工具系统（v2新增）**

#### US-9.1: 自动技能释放器
**As a** developer
**I want** to auto-trigger jutsu for testing
**So that** I can test combat without manual gestures

**Acceptance Criteria**:
- [ ] Press 'T' key to enable test mode
- [ ] Auto-fires jutsu every 1 second
- [ ] Cycles through all jutsu types
- [ ] Shows "TEST MODE" indicator

**Test Case**:
```typescript
test('auto jutsu releaser', () => {
  const autoReleaser = new AutoJutsuReleaser({ interval: 1 });
  autoReleaser.update(1.1);
  expect(autoReleaser.shouldRelease()).toBe(true);

  const jutsu = autoReleaser.getNextJutsu();
  expect(jutsu).toBeDefined();
});

test('cycles through jutsu types', () => {
  const releaser = new AutoJutsuReleaser();
  const jutsu1 = releaser.getNextJutsu();
  const jutsu2 = releaser.getNextJutsu();
  expect(jutsu1.name).not.toBe(jutsu2.name);
});
```

#### US-9.2: 敌人波次控制器
**As a** developer
**I want** to manually control enemy waves
**So that** I can test specific scenarios

**Acceptance Criteria**:
- [ ] Press '1-9' to start specific wave
- [ ] Press 'E' to spawn single enemy
- [ ] Press 'Shift+E' to spawn 10 enemies
- [ ] Shows wave number overlay

**Test Case**:
```typescript
test('wave controller spawns wave', () => {
  const controller = new WaveController();
  controller.startWave(3);
  expect(controller.currentWave()).toBe(3);
  expect(controller.getWaveConfig().speed).toBe(7);
});

test('manual enemy spawn', () => {
  const controller = new WaveController();
  const enemy = controller.spawnEnemy();
  expect(enemy.position.x).toBeGreaterThan(10);
});
```

#### US-9.3: 游戏场景调试器
**As a** developer
**I want** real-time game state visualization
**So that** I can debug issues quickly

**Debug Overlay Shows**:
- [ ] FPS counter
- [ ] Entity count (enemies, jutsu, particles)
- [ ] Collision boundaries
- [ ] Performance metrics

**Test Case**:
```typescript
test('debug overlay shows FPS', () => {
  const debugger = new GameDebugger();
  debugger.update(0.016); // 60 FPS
  expect(debugger.getFPS()).toBeCloseTo(60, 1);
});

test('entity counter', () => {
  const game = createGame();
  game.spawnEnemy();
  game.releaseJutsu();
  const debugger = new GameDebugger(game);
  expect(debugger.getEntityCount('enemies')).toBe(1);
  expect(debugger.getEntityCount('jutsu')).toBe(1);
});
```

---

## Non-Functional Requirements

### Performance（v2更新）
- [ ] 60 FPS stable with 10 enemies + 5 jutsu + 100 particles
- [ ] MediaPipe init < 3 seconds
- [ ] Gesture detection < 300ms（v2: 从500ms提升）
- [ ] Memory < 300MB（v2: 从200MB放宽，因为加了特效）

### Testing（v2新增）
- [ ] **Unit test coverage ≥ 80%**
- [ ] **Integration tests for critical flows**
- [ ] **All tests pass in CI/CD**
- [ ] **Test execution time < 10 seconds**

### Browser Compatibility
- Chrome 100+, Edge 100+, Firefox 100+ (unchanged)

### Accessibility（v2新增）
- [ ] Color-blind friendly palette
- [ ] Can play without sound
- [ ] Keyboard shortcuts for all actions

---

## Edge Cases and Error Handling

### v2新增边界情况

**Test Edge Cases**:
1. **Rapid Fire**: 10 jutsu released in 1 second
   - Expected: All jutsu tracked, no performance drop
   - Test: `test('handle rapid fire', () => { ... })`

2. **Wave Clear**: Last enemy dies exactly when wave timer hits 0
   - Expected: Wave transitions correctly
   - Test: `test('wave transition on last kill', () => { ... })`

3. **Particle Overflow**: 1000 particles active
   - Expected: Oldest particles removed (max 500)
   - Test: `test('particle limit enforced', () => { ... })`

4. **Combo Edge**: Hit at exactly 3.0 seconds
   - Expected: Combo should still count (<=3, not <3)
   - Test: `test('combo timer boundary', () => { ... })`

---

## Acceptance Test Plan

### v2 TDD验收标准

**Phase 1: Unit Tests**
- [ ] All 20+ test suites pass
- [ ] Code coverage report shows ≥80%
- [ ] No failing tests in CI/CD

**Phase 2: Integration Tests**
- [ ] Gesture → Jutsu flow works
- [ ] Enemy spawn → collision → destroy flow works
- [ ] Score → Combo system works

**Phase 3: Manual Testing**
- [ ] Visual: Jutsu trails visible
- [ ] Visual: Explosions appear on hit
- [ ] Audio: All sounds play correctly
- [ ] Feel: Game feels "fast" and "satisfying"

**Phase 4: Test Tools Validation**
- [ ] Auto-releaser can complete wave 1 solo
- [ ] Wave controller can spawn all wave types
- [ ] Debug overlay shows accurate data

---

## Priority Matrix

| User Story | Priority | Reason | v2变更 |
|-----------|---------|--------|--------|
| US-7.1 (Unit Tests) | **P0** | Foundation for TDD | **🆕 新增** |
| US-2.1 (Seal Sequence) | **P0** | Core gameplay split | **✅ 重构** |
| US-3.1 (Bullet Hell) | **P0** | Defines "fun" factor | **✅ 重构** |
| US-8.1 (Trails) | **P1** | Visual satisfaction | **🆕 新增** |
| US-8.2 (Explosions) | **P1** | Hit feedback | **🆕 新增** |
| US-9.1 (Auto-Releaser) | **P2** | Dev tool, not player-facing | **🆕 新增** |

---

## Success Metrics

### v2新增指标

**Code Quality**:
- Test coverage: **≥80%** ✅
- All tests pass: **100%** ✅
- CI/CD green: **✅**

**Gameplay Feel**:
- Player survey: "Game feels fast": **≥80% agree**
- Player survey: "Visuals are satisfying": **≥80% agree**
- Average session length: **≥10 minutes**

**Performance**:
- Frame rate: **60 FPS ±5**
- Load time: **<5 seconds**

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| v1.0 | 2026-02-05 | AI | Initial requirements |
| v2.0 | 2026-02-06 | AI | **TDD重构：加入测试需求、弹幕机制、特效系统** |

---

**Status**: ✅ Requirements v2.0 Complete - Ready for Design Phase
**Next Step**: Update design.md to support TDD architecture
