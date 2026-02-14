/**
 * v178: 忍术升级系统
 * 允许玩家通过使用忍术来升级，提升伤害和效果
 */

import type { Jutsu } from '../types/index.ts';

// 忍术等级配置
export interface JutsuLevelConfig {
  level: number;
  requiredExp: number;
  damageMultiplier: number;
  chakraCostReduction: number;
  cooldownReduction: number;
  bonusEffects: string[];
}

// 忍术升级状态
export interface JutsuUpgradeState {
  jutsuId: string;
  level: number;
  experience: number;
  totalExperience: number;
}

// 升级奖励
export interface LevelUpReward {
  jutsuId: string;
  newLevel: number;
  bonuses: {
    damageIncrease: number;
    chakraReduction: number;
    cooldownReduction: number;
  };
}

// 预定义的等级配置
const LEVEL_CONFIGS: JutsuLevelConfig[] = [
  { level: 1, requiredExp: 0, damageMultiplier: 1.0, chakraCostReduction: 0, cooldownReduction: 0, bonusEffects: [] },
  { level: 2, requiredExp: 100, damageMultiplier: 1.1, chakraCostReduction: 0, cooldownReduction: 0, bonusEffects: [] },
  { level: 3, requiredExp: 300, damageMultiplier: 1.2, chakraCostReduction: 5, cooldownReduction: 5, bonusEffects: ['伤害+20%'] },
  { level: 4, requiredExp: 600, damageMultiplier: 1.35, chakraCostReduction: 5, cooldownReduction: 5, bonusEffects: [] },
  { level: 5, requiredExp: 1000, damageMultiplier: 1.5, chakraCostReduction: 10, cooldownReduction: 10, bonusEffects: ['伤害+50%', '查克拉-10%'] },
  { level: 6, requiredExp: 1500, damageMultiplier: 1.65, chakraCostReduction: 10, cooldownReduction: 10, bonusEffects: [] },
  { level: 7, requiredExp: 2200, damageMultiplier: 1.8, chakraCostReduction: 15, cooldownReduction: 15, bonusEffects: ['伤害+80%'] },
  { level: 8, requiredExp: 3000, damageMultiplier: 2.0, chakraCostReduction: 15, cooldownReduction: 15, bonusEffects: [] },
  { level: 9, requiredExp: 4000, damageMultiplier: 2.2, chakraCostReduction: 20, cooldownReduction: 20, bonusEffects: ['伤害翻倍'] },
  { level: 10, requiredExp: 5500, damageMultiplier: 2.5, chakraCostReduction: 25, cooldownReduction: 25, bonusEffects: ['大师级', '伤害+150%', '查克拉-25%'] },
];

// 经验获取配置
const EXP_CONFIG = {
  baseExpPerUse: 10,
  comboMultiplier: 0.1, // 每连击增加10%
  killBonus: 5, // 击杀额外奖励
  bossKillBonus: 50, // Boss击杀奖励
  waveClearBonus: 20, // 波次完成奖励
};

/**
 * 忍术升级服务类
 */
class JutsuUpgradeService {
  private upgradeStates: Map<string, JutsuUpgradeState> = new Map();
  private levelUpCallbacks: ((reward: LevelUpReward) => void)[] = [];
  private maxLevel = 10;

  /**
   * 初始化服务
   */
  initialize(): void {
    this.loadFromStorage();
  }

  /**
   * 获取忍术的升级状态
   */
  getUpgradeState(jutsuId: string): JutsuUpgradeState {
    if (!this.upgradeStates.has(jutsuId)) {
      this.upgradeStates.set(jutsuId, {
        jutsuId,
        level: 1,
        experience: 0,
        totalExperience: 0,
      });
    }
    return this.upgradeStates.get(jutsuId)!;
  }

  /**
   * 获取忍术等级配置
   */
  getLevelConfig(level: number): JutsuLevelConfig {
    if (level < 1) level = 1;
    if (level > this.maxLevel) level = this.maxLevel;
    return LEVEL_CONFIGS[level - 1];
  }

  /**
   * 获取下一级所需经验
   */
  getExpToNextLevel(jutsuId: string): number {
    const state = this.getUpgradeState(jutsuId);
    if (state.level >= this.maxLevel) return 0;

    const nextConfig = this.getLevelConfig(state.level + 1);
    const currentConfig = this.getLevelConfig(state.level);
    return nextConfig.requiredExp - currentConfig.requiredExp;
  }

  /**
   * 获取当前等级进度
   */
  getLevelProgress(jutsuId: string): number {
    const state = this.getUpgradeState(jutsuId);
    if (state.level >= this.maxLevel) return 100;

    const expToNext = this.getExpToNextLevel(jutsuId);
    if (expToNext === 0) return 100;

    const currentConfig = this.getLevelConfig(state.level);
    const expInCurrentLevel = state.totalExperience - currentConfig.requiredExp;

    return Math.min(100, (expInCurrentLevel / expToNext) * 100);
  }

  /**
   * 添加经验
   */
  addExperience(jutsuId: string, amount: number): LevelUpReward | null {
    const state = this.getUpgradeState(jutsuId);

    if (state.level >= this.maxLevel) {
      return null; // 已达最高级
    }

    const oldLevel = state.level;
    state.experience += amount;
    state.totalExperience += amount;

    // 检查是否升级
    while (state.level < this.maxLevel) {
      const nextConfig = this.getLevelConfig(state.level + 1);
      if (state.totalExperience >= nextConfig.requiredExp) {
        state.level++;
      } else {
        break;
      }
    }

    this.saveToStorage();

    if (state.level > oldLevel) {
      const reward = this.createLevelUpReward(jutsuId, oldLevel, state.level);
      this.notifyLevelUp(reward);
      return reward;
    }

    return null;
  }

  /**
   * 计算使用忍术获得的经验
   */
  calculateExpFromUse(_jutsuId: string, combo: number, didKill: boolean, isBoss: boolean): number {
    let exp = EXP_CONFIG.baseExpPerUse;

    // 连击加成
    exp += Math.floor(exp * combo * EXP_CONFIG.comboMultiplier);

    // 击杀奖励
    if (didKill) {
      exp += isBoss ? EXP_CONFIG.bossKillBonus : EXP_CONFIG.killBonus;
    }

    return exp;
  }

  /**
   * 计算波次完成奖励
   */
  calculateWaveClearBonus(usedJutsus: string[]): Record<string, number> {
    const bonus: Record<string, number> = {};

    usedJutsus.forEach(jutsuId => {
      const currentBonus = bonus[jutsuId] || 0;
      bonus[jutsuId] = currentBonus + EXP_CONFIG.waveClearBonus;
    });

    return bonus;
  }

  /**
   * 获取升级后的忍术属性
   */
  getUpgradedJutsuStats(baseJutsu: Jutsu): {
    damage: number;
    chakraCost: number;
    cooldown: number;
    bonusEffects: string[];
  } {
    const state = this.getUpgradeState(baseJutsu.id);
    const config = this.getLevelConfig(state.level);

    return {
      damage: Math.floor(baseJutsu.damage * config.damageMultiplier),
      chakraCost: Math.floor(baseJutsu.chakraCost * (1 - config.chakraCostReduction / 100)),
      cooldown: Math.floor(baseJutsu.cooldown * (1 - config.cooldownReduction / 100)),
      bonusEffects: config.bonusEffects,
    };
  }

  /**
   * 获取所有忍术的升级状态
   */
  getAllUpgradeStates(): JutsuUpgradeState[] {
    return Array.from(this.upgradeStates.values());
  }

  /**
   * 获取总等级
   */
  getTotalLevel(): number {
    let total = 0;
    this.upgradeStates.forEach(state => {
      total += state.level;
    });
    return total;
  }

  /**
   * 获取最高等级的忍术
   */
  getHighestLevelJutsu(): JutsuUpgradeState | null {
    let highest: JutsuUpgradeState | null = null;
    this.upgradeStates.forEach(state => {
      if (!highest || state.level > highest.level) {
        highest = state;
      }
    });
    return highest;
  }

  /**
   * 注册升级回调
   */
  onLevelUp(callback: (reward: LevelUpReward) => void): void {
    this.levelUpCallbacks.push(callback);
  }

  /**
   * 移除升级回调
   */
  removeLevelUpCallback(callback: (reward: LevelUpReward) => void): void {
    const index = this.levelUpCallbacks.indexOf(callback);
    if (index !== -1) {
      this.levelUpCallbacks.splice(index, 1);
    }
  }

  /**
   * 创建升级奖励
   */
  private createLevelUpReward(jutsuId: string, oldLevel: number, newLevel: number): LevelUpReward {
    const oldConfig = this.getLevelConfig(oldLevel);
    const newConfig = this.getLevelConfig(newLevel);

    return {
      jutsuId,
      newLevel,
      bonuses: {
        damageIncrease: (newConfig.damageMultiplier - oldConfig.damageMultiplier) * 100,
        chakraReduction: newConfig.chakraCostReduction - oldConfig.chakraCostReduction,
        cooldownReduction: newConfig.cooldownReduction - oldConfig.cooldownReduction,
      },
    };
  }

  /**
   * 通知升级回调
   */
  private notifyLevelUp(reward: LevelUpReward): void {
    this.levelUpCallbacks.forEach(callback => {
      try {
        callback(reward);
      } catch (error) {
        console.error('Level up callback error:', error);
      }
    });
  }

  /**
   * 保存到localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.upgradeStates.values());
      localStorage.setItem('jutsu_upgrades', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save jutsu upgrades:', error);
    }
  }

  /**
   * 从localStorage加载
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('jutsu_upgrades');
      if (data) {
        const states = JSON.parse(data) as JutsuUpgradeState[];
        states.forEach(state => {
          this.upgradeStates.set(state.jutsuId, state);
        });
      }
    } catch (error) {
      console.error('Failed to load jutsu upgrades:', error);
    }
  }

  /**
   * 重置所有升级
   */
  resetAll(): void {
    this.upgradeStates.clear();
    localStorage.removeItem('jutsu_upgrades');
  }

  /**
   * 获取忍术等级显示文本
   */
  getLevelDisplayText(level: number): string {
    const levelNames = [
      '', '入门', '熟练', '精通', '专家', '大师',
      '宗师', '传说', '神话', '超凡', '永恒'
    ];
    return levelNames[level] || `Lv.${level}`;
  }

  /**
   * 获取等级颜色
   */
  getLevelColor(level: number): string {
    const colors = [
      '#ffffff', '#ffffff', '#00ff00', '#00ffaa', '#00aaff',
      '#aa00ff', '#ff00aa', '#ff5500', '#ffaa00', '#ff0000'
    ];
    return colors[level] || '#ffffff';
  }

  /**
   * 检查是否有任何忍术达到指定等级
   */
  hasJutsuAtLevel(level: number): boolean {
    for (const state of this.upgradeStates.values()) {
      if (state.level >= level) return true;
    }
    return false;
  }

  /**
   * 获取达到指定等级的忍术数量
   */
  countJutsuAtLevel(level: number): number {
    let count = 0;
    this.upgradeStates.forEach(state => {
      if (state.level >= level) count++;
    });
    return count;
  }
}

// 导出单例
export const jutsuUpgradeService = new JutsuUpgradeService();
