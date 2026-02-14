import * as THREE from 'three';

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
}

/**
 * 波次配置表
 */
const waveConfigs: Record<number, WaveConfig> = {
  1: { enemyCount: 10, speed: 5, health: 1, interval: 2, size: 1 },
  2: { enemyCount: 15, speed: 6, health: 1, interval: 1.5, size: 1 },
  3: { enemyCount: 20, speed: 7, health: 2, interval: 1.5, size: 1.2 },
  4: { enemyCount: 25, speed: 8, health: 2, interval: 1, size: 1.2 },
  5: { enemyCount: 1, speed: 2, health: 50, interval: 10, size: 5 }, // Boss波次
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
