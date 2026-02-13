import * as THREE from 'three';

/**
 * 敌人实体接口
 */
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
  // v174新增：Boss系统
  isBoss?: boolean;
  bossType?: BossType;
  bossSkills?: BossSkill[];
  skillCooldowns?: Record<string, number>;
  armor?: number; // 护甲值
  shield?: number; // 护盾值
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
export function createEnemy(options: { wave: number }): Enemy {
  const config = getWaveConfig(options.wave);

  // 从右侧生成（x=15）
  const xPosition = 15;

  // Y轴随机位置（-5到5）
  const yPosition = (Math.random() - 0.5) * 10;

  // Z轴固定在0
  const zPosition = 0;

  // 向左移动，速度为wave配置的速度
  const velocityX = -config.speed;

  return {
    id: `enemy-${Date.now()}-${Math.random()}`,
    position: new THREE.Vector3(xPosition, yPosition, zPosition),
    velocity: new THREE.Vector3(velocityX, 0, 0),
    health: config.health,
    maxHealth: config.health,
    size: config.size,
    wave: options.wave
  };
}

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
