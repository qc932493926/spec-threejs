import * as THREE from 'three';

/**
 * v182: 敌人类型扩展
 */
export type EnemyType = 'basic' | 'fast' | 'tank' | 'flying' | 'splitting' | 'stealth' | 'exploder' | 'summoner';

/**
 * 敌人实体接口
 */
export interface Enemy {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  size: number;
  wave: number;
  type: EnemyType; // v182: 使用新的敌人类型
  // v174新增：Boss系统
  isBoss?: boolean;
  bossType?: BossType;
  bossSkills?: BossSkill[];
  skillCooldowns?: Record<string, number>;
  armor?: number; // 护甲值
  shield?: number; // 护盾值
  // v182新增：特殊敌人属性
  canFly?: boolean; // 飞行敌人
  canSplit?: boolean; // 分裂敌人
  splitCount?: number; // 分裂数量
  isInvisible?: boolean; // 隐形敌人
  invisibilityDuration?: number; // 隐形持续时间
  explosionDamage?: number; // 自爆伤害
  explosionRadius?: number; // 自爆范围
  canSummon?: boolean; // 召唤师敌人
  summonCount?: number; // 召唤数量
  summonCooldown?: number; // 召唤冷却
}


/**
 * Boss配置表
 */
export const bossConfigs: Record<BossType, BossConfig> = {
  nine_tails: {
    type: 'nine_tails',
    name: '九尾妖狐',
    health: 500,
    size: 6,
    speed: 1.5,
    armor: 20,
    color: 0xff6600,
    reward: 5000,
    skills: [
      { id: 'tail_strike', name: '尾兽玉', cooldown: 5000, damage: 100, effectType: 'projectile', range: 20 },
      { id: 'roar', name: '尾兽咆哮', cooldown: 10000, damage: 80, effectType: 'area', range: 15 },
      { id: 'rage', name: '狂暴模式', cooldown: 20000, damage: 0, effectType: 'buff', duration: 10000 }
    ]
  },
  orochimaru: {
    type: 'orochimaru',
    name: '大蛇丸',
    health: 400,
    size: 5,
    speed: 2,
    armor: 10,
    color: 0x9932cc,
    reward: 4000,
    skills: [
      { id: 'snake_bite', name: '潜影蛇手', cooldown: 3000, damage: 60, effectType: 'projectile', range: 15 },
      { id: 'summon_snakes', name: '通灵术·蛇', cooldown: 15000, damage: 0, effectType: 'summon' },
      { id: 'rebirth', name: '不死转生', cooldown: 30000, damage: 0, effectType: 'buff', duration: 5000 }
    ]
  },
  itachi: {
    type: 'itachi',
    name: '宇智波鼬',
    health: 350,
    size: 4,
    speed: 2.5,
    armor: 5,
    color: 0xcc0000,
    reward: 4500,
    skills: [
      { id: 'amaterasu_boss', name: '天照', cooldown: 8000, damage: 120, effectType: 'area', range: 10 },
      { id: 'tsukuyomi_boss', name: '月读', cooldown: 12000, damage: 50, effectType: 'area', range: 20 },
      { id: 'susano', name: '须佐能乎', cooldown: 25000, damage: 0, effectType: 'shield', duration: 8000 }
    ]
  },
  pain: {
    type: 'pain',
    name: '佩恩',
    health: 600,
    size: 5,
    speed: 1.8,
    armor: 25,
    color: 0xffa500,
    reward: 6000,
    skills: [
      { id: 'shinra_tensei_boss', name: '神罗天征', cooldown: 10000, damage: 150, effectType: 'area', range: 20 },
      { id: 'basho_tennin', name: '万象天引', cooldown: 8000, damage: 80, effectType: 'area', range: 15 },
      { id: 'chibaku_tensei_boss', name: '地爆天星', cooldown: 30000, damage: 200, effectType: 'area', range: 25 }
    ]
  },
  madara: {
    type: 'madara',
    name: '宇智波斑',
    health: 800,
    size: 6,
    speed: 2,
    armor: 30,
    color: 0x4b0082,
    reward: 8000,
    skills: [
      { id: 'fire_style', name: '火遁·豪火灭却', cooldown: 6000, damage: 100, effectType: 'area', range: 18 },
      { id: 'susano_boss', name: '完全体须佐能乎', cooldown: 20000, damage: 0, effectType: 'shield', duration: 10000 },
      { id: 'meteor', name: '天碍震星', cooldown: 40000, damage: 300, effectType: 'area', range: 30 }
    ]
  },
  kaguya: {
    type: 'kaguya',
    name: '大筒木辉夜',
    health: 1000,
    size: 7,
    speed: 1.5,
    armor: 40,
    color: 0xe6e6fa,
    reward: 15000,
    skills: [
      { id: 'dimension_shift', name: '空间转移', cooldown: 15000, damage: 0, effectType: 'buff', duration: 3000 },
      { id: 'ash_bones', name: '共杀灰骨', cooldown: 5000, damage: 200, effectType: 'projectile', range: 20 },
      { id: 'expansive_truth', name: '膨胀求道玉', cooldown: 35000, damage: 400, effectType: 'area', range: 35 },
      { id: 'infinite_tsukuyomi', name: '无限月读', cooldown: 60000, damage: 0, effectType: 'area', range: 50 }
    ]
  }
};

/**
 * 获取Boss配置
 * @param bossType Boss类型
 * @returns Boss配置
 */
export function getBossConfig(bossType: BossType): BossConfig {
  return bossConfigs[bossType];
}

/**
 * 创建Boss敌人
 * @param bossType Boss类型
 * @param wave 当前波次
 * @returns Boss敌人实体
 */
export function createBoss(bossType: BossType, wave: number): Enemy {
  const config = bossConfigs[bossType];
  const skillCooldowns: Record<string, number> = {};
  config.skills.forEach(skill => {
    skillCooldowns[skill.id] = 0;
  });

  return {
    id: `boss-${bossType}-${Date.now()}`,
    position: new THREE.Vector3(15, 0, 0),
    velocity: new THREE.Vector3(-config.speed, 0, 0),
    health: config.health,
    maxHealth: config.health,
    size: config.size,
    wave,
    type: 'basic' as EnemyType, // Boss使用基础类型
    isBoss: true,
    bossType,
    bossSkills: config.skills,
    skillCooldowns,
    armor: config.armor,
    shield: 0
  };
}

/**
 * Boss类型
 */
export type BossType = 
  | 'nine_tails'      // 九尾
  | 'orochimaru'      // 大蛇丸
  | 'itachi'          // 宇智波鼬
  | 'pain'            // 佩恩
  | 'madara'          // 宇智波斑
  | 'kaguya';         // 大筒木辉夜

/**
 * Boss技能定义
 */
export interface BossSkill {
  id: string;
  name: string;
  cooldown: number; // 冷却时间(毫秒)
  damage: number;
  effectType: 'projectile' | 'area' | 'summon' | 'buff' | 'shield';
  range?: number;
  duration?: number;
}

/**
 * Boss配置
 */
export interface BossConfig {
  type: BossType;
  name: string;
  health: number;
  size: number;
  speed: number;
  armor: number;
  skills: BossSkill[];
  color: number; // 十六进制颜色
  reward: number; // 击败奖励分数
}

/**
 * 波次配置接口
 */
export interface WaveConfig {
  enemyCount: number;  // 本波次敌人总数
  speed: number;       // 敌人移动速度
  health: number;      // 敌人血量
  interval: number;    // 生成间隔（秒）
  size: number;        // 敌人大小
  // v174新增
  isBossWave?: boolean;     // 是否是Boss波次
  bossType?: BossType;      // Boss类型
  eliteCount?: number;      // 精英敌人数量
  eliteHealth?: number;     // 精英敌人血量
}

/**
 * 波次配置表
 */
const waveConfigs: Record<number, WaveConfig> = {
  1: { enemyCount: 10, speed: 5, health: 1, interval: 2, size: 1 },
  2: { enemyCount: 15, speed: 6, health: 1, interval: 1.5, size: 1 },
  3: { enemyCount: 20, speed: 7, health: 2, interval: 1.5, size: 1.2 },
  4: { enemyCount: 25, speed: 8, health: 2, interval: 1, size: 1.2 },
  5: { enemyCount: 1, speed: 2, health: 50, interval: 10, size: 5 }, // 小Boss波次
  // v174新增：更多波次配置
  6: { enemyCount: 30, speed: 8, health: 3, interval: 0.8, size: 1.3 },
  7: { enemyCount: 35, speed: 9, health: 3, interval: 0.7, size: 1.3 },
  8: { enemyCount: 40, speed: 9, health: 4, interval: 0.6, size: 1.4 },
  9: { enemyCount: 45, speed: 10, health: 4, interval: 0.5, size: 1.4 },
  10: { enemyCount: 1, speed: 1.5, health: 100, interval: 10, size: 6 }, // Boss波次
};

/**
 * 获取波次配置
 * @param wave 波次号
 * @returns 波次配置
 */
export function getWaveConfig(wave: number): WaveConfig {
  // 如果超出预定义波次，使用递增公式
  if (wave in waveConfigs) {
    return waveConfigs[wave];
  }

  // 波次5+的递增配置
  return {
    enemyCount: 10 + (wave - 1) * 5,
    speed: 5 + (wave - 1),
    health: Math.floor(wave / 2),
    interval: Math.max(0.5, 2 - wave * 0.1),
    size: 1 + (wave - 1) * 0.1
  };
}

/**
 * 创建敌人实体
 * @param options 创建选项
 * @returns 敌人实体
 */
export function createEnemy(options: { wave: number; type?: EnemyType }): Enemy {
  const config = getWaveConfig(options.wave);
  const enemyType = options.type || getRandomEnemyType(options.wave);

  // 从右侧生成（x=15）
  const xPosition = 15;

  // Y轴随机位置（-5到5）
  const yPosition = (Math.random() - 0.5) * 10;

  // Z轴固定在0，飞行敌人在更高位置
  const zPosition = enemyType === 'flying' ? 2 : 0;

  // 向左移动，速度为wave配置的速度
  const velocityX = -config.speed;

  // 基础敌人
  const baseEnemy: Enemy = {
    id: `enemy-${Date.now()}-${Math.random()}`,
    position: new THREE.Vector3(xPosition, yPosition, zPosition),
    velocity: new THREE.Vector3(velocityX, 0, 0),
    health: config.health,
    maxHealth: config.health,
    size: config.size,
    wave: options.wave,
    type: enemyType,
  };

  // 根据敌人类型应用特殊属性
  return applyEnemyTypeModifiers(baseEnemy, enemyType, config);
}

/**
 * v182: 根据波次随机选择敌人类型
 */
function getRandomEnemyType(wave: number): EnemyType {
  // 基础敌人类型权重
  const weights: { type: EnemyType; weight: number; minWave: number }[] = [
    { type: 'basic', weight: 50, minWave: 1 },
    { type: 'fast', weight: 25, minWave: 2 },
    { type: 'tank', weight: 15, minWave: 3 },
    { type: 'flying', weight: 10, minWave: 4 },
    { type: 'splitting', weight: 8, minWave: 5 },
    { type: 'stealth', weight: 5, minWave: 6 },
    { type: 'exploder', weight: 5, minWave: 7 },
    { type: 'summoner', weight: 3, minWave: 8 },
  ];

  // 过滤掉当前波次不可用的敌人类型
  const available = weights.filter(w => wave >= w.minWave);
  const totalWeight = available.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const w of available) {
    random -= w.weight;
    if (random <= 0) {
      return w.type;
    }
  }

  return 'basic';
}

/**
 * v182: 应用敌人类型修饰符
 */
function applyEnemyTypeModifiers(enemy: Enemy, type: EnemyType, config: WaveConfig): Enemy {
  switch (type) {
    case 'basic':
      // 基础敌人 - 无特殊属性
      break;

    case 'fast':
      // 快速敌人 - 速度快但血量低
      enemy.velocity.x *= 1.8;
      enemy.health = Math.floor(config.health * 0.6);
      enemy.maxHealth = enemy.health;
      enemy.size *= 0.8;
      break;

    case 'tank':
      // 坦克敌人 - 速度慢但血量高
      enemy.velocity.x *= 0.5;
      enemy.health = Math.floor(config.health * 3);
      enemy.maxHealth = enemy.health;
      enemy.size *= 1.5;
      enemy.armor = 5;
      break;

    case 'flying':
      // 飞行敌人 - 在空中移动，Y轴波动
      enemy.canFly = true;
      enemy.velocity.x *= 1.2;
      enemy.velocity.y = Math.sin(Date.now() * 0.001) * 2;
      enemy.health = Math.floor(config.health * 0.8);
      enemy.maxHealth = enemy.health;
      enemy.size *= 0.9;
      break;

    case 'splitting':
      // 分裂敌人 - 死亡时分裂成小敌人
      enemy.canSplit = true;
      enemy.splitCount = 3;
      enemy.health = Math.floor(config.health * 1.5);
      enemy.maxHealth = enemy.health;
      enemy.size *= 1.2;
      break;

    case 'stealth':
      // 隐形敌人 - 周期性隐形
      enemy.isInvisible = false;
      enemy.invisibilityDuration = 3000;
      enemy.velocity.x *= 1.3;
      enemy.health = Math.floor(config.health * 0.7);
      enemy.maxHealth = enemy.health;
      enemy.size *= 0.85;
      break;

    case 'exploder':
      // 自爆敌人 - 接近玩家时爆炸
      enemy.explosionDamage = config.health * 2;
      enemy.explosionRadius = 5;
      enemy.velocity.x *= 1.5;
      enemy.health = Math.floor(config.health * 0.5);
      enemy.maxHealth = enemy.health;
      enemy.size *= 0.9;
      break;

    case 'summoner':
      // 召唤师敌人 - 召唤小敌人
      enemy.canSummon = true;
      enemy.summonCount = 2;
      enemy.summonCooldown = 5000;
      enemy.velocity.x *= 0.6;
      enemy.health = Math.floor(config.health * 2);
      enemy.maxHealth = enemy.health;
      enemy.size *= 1.3;
      enemy.skillCooldowns = { summon: 0 };
      break;
  }

  return enemy;
}

/**
 * v182: 创建分裂后的小敌人
 */
export function createSplitEnemies(parent: Enemy): Enemy[] {
  if (!parent.canSplit || !parent.splitCount) return [];

  const children: Enemy[] = [];
  for (let i = 0; i < parent.splitCount; i++) {
    const angle = (i / parent.splitCount) * Math.PI * 2;
    const offset = new THREE.Vector3(
      Math.cos(angle) * 0.5,
      Math.sin(angle) * 0.5,
      0
    );

    const child: Enemy = {
      id: `enemy-split-${Date.now()}-${i}`,
      position: parent.position.clone().add(offset),
      velocity: new THREE.Vector3(
        parent.velocity.x * 1.2,
        Math.sin(angle) * 2,
        0
      ),
      health: Math.floor(parent.maxHealth * 0.3),
      maxHealth: Math.floor(parent.maxHealth * 0.3),
      size: parent.size * 0.6,
      wave: parent.wave,
      type: 'basic',
    };
    children.push(child);
  }

  return children;
}

/**
 * v182: 创建被召唤的敌人
 */
export function createSummonedEnemies(summoner: Enemy): Enemy[] {
  if (!summoner.canSummon || !summoner.summonCount) return [];

  const summoned: Enemy[] = [];
  for (let i = 0; i < summoner.summonCount; i++) {
    const angle = (i / summoner.summonCount) * Math.PI * 2;
    const offset = new THREE.Vector3(
      Math.cos(angle) * 2,
      Math.sin(angle) * 2,
      0
    );

    const minion: Enemy = {
      id: `enemy-summon-${Date.now()}-${i}`,
      position: summoner.position.clone().add(offset),
      velocity: new THREE.Vector3(summoner.velocity.x * 1.5, 0, 0),
      health: Math.floor(summoner.maxHealth * 0.2),
      maxHealth: Math.floor(summoner.maxHealth * 0.2),
      size: summoner.size * 0.5,
      wave: summoner.wave,
      type: 'fast',
    };
    summoned.push(minion);
  }

  return summoned;
}

/**
 * v182: 敌人类型配置（用于UI显示）
 */
export const enemyTypeConfigs: Record<EnemyType, { name: string; color: number; description: string }> = {
  basic: { name: '基础忍者', color: 0xff4444, description: '普通敌人' },
  fast: { name: '疾风忍者', color: 0x00ffff, description: '移动速度快' },
  tank: { name: '重装忍者', color: 0x44ff44, description: '高血量高护甲' },
  flying: { name: '飞天忍者', color: 0xff88ff, description: '空中移动' },
  splitting: { name: '分裂忍者', color: 0xffff00, description: '死亡时分裂' },
  stealth: { name: '暗影忍者', color: 0x888888, description: '周期性隐形' },
  exploder: { name: '爆裂忍者', color: 0xff8800, description: '接近时爆炸' },
  summoner: { name: '通灵忍者', color: 0x8800ff, description: '召唤小敌人' },
};

/**
 * 敌人生成器类
 */
export class EnemySpawner {
  private wave: number;
  private timer: number = 0;
  private config: WaveConfig;
  private maxCount: number;

  constructor(options: { wave: number; maxCount?: number }) {
    this.wave = options.wave;
    this.config = getWaveConfig(this.wave);
    this.maxCount = options.maxCount ?? 10; // 默认最多10个敌人
  }

  /**
   * 更新计时器
   * @param deltaTime 增量时间（秒）
   */
  update(deltaTime: number): void {
    this.timer += deltaTime;
  }

  /**
   * 检查是否应该生成敌人
   * @returns 是否到达生成时间
   */
  shouldSpawn(): boolean {
    return this.timer >= this.config.interval;
  }

  /**
   * 检查是否可以生成（考虑maxCount）
   * @param currentEnemies 当前场上敌人列表
   * @returns 是否可以生成
   */
  canSpawn(currentEnemies: any[]): boolean {
    return currentEnemies.length < this.maxCount;
  }

  /**
   * 生成敌人并重置计时器
   * @returns 新生成的敌人
   */
  spawn(): Enemy {
    this.timer = 0; // 重置计时器
    return createEnemy({ wave: this.wave });
  }

  /**
   * 获取当前波次
   */
  getWave(): number {
    return this.wave;
  }

  /**
   * 切换到下一波
   */
  nextWave(): void {
    this.wave++;
    this.config = getWaveConfig(this.wave);
    this.timer = 0;
  }
}
