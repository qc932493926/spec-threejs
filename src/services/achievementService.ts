// 成就定义
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  requirement: (stats: PlayerStats) => boolean;
}

// 玩家统计数据
export interface PlayerStats {
  totalScore: number;
  maxCombo: number;
  maxWave: number;
  totalKills: number;
  jutsusUsed: Record<string, number>;
  enemyKills: Record<string, number>;
  gamesPlayed: number;
}

// 预定义成就列表
const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  // 分数成就
  {
    id: 'first_steps',
    name: '初出茅庐',
    description: '获得500分',
    icon: '🌱',
    requirement: (stats) => stats.totalScore >= 500,
  },
  {
    id: 'rising_star',
    name: '新星崛起',
    description: '获得2000分',
    icon: '⭐',
    requirement: (stats) => stats.totalScore >= 2000,
  },
  {
    id: 'legendary',
    name: '传说忍者',
    description: '获得5000分',
    icon: '🌟',
    requirement: (stats) => stats.totalScore >= 5000,
  },
  {
    id: 'impossible',
    name: '超越极限',
    description: '获得10000分',
    icon: '💫',
    requirement: (stats) => stats.totalScore >= 10000,
  },

  // 连击成就
  {
    id: 'combo_10',
    name: '连击新手',
    description: '达成10连击',
    icon: '🔥',
    requirement: (stats) => stats.maxCombo >= 10,
  },
  {
    id: 'combo_25',
    name: '连击达人',
    description: '达成25连击',
    icon: '💥',
    requirement: (stats) => stats.maxCombo >= 25,
  },
  {
    id: 'combo_50',
    name: '连击大师',
    description: '达成50连击',
    icon: '⚡',
    requirement: (stats) => stats.maxCombo >= 50,
  },
  {
    id: 'combo_100',
    name: '连击之神',
    description: '达成100连击',
    icon: '👑',
    requirement: (stats) => stats.maxCombo >= 100,
  },

  // 波次成就
  {
    id: 'wave_5',
    name: '初步考验',
    description: '到达第5波',
    icon: '🌊',
    requirement: (stats) => stats.maxWave >= 5,
  },
  {
    id: 'wave_10',
    name: '勇往直前',
    description: '到达第10波',
    icon: '🏄',
    requirement: (stats) => stats.maxWave >= 10,
  },
  {
    id: 'wave_20',
    name: '无尽挑战',
    description: '到达第20波',
    icon: '🌪️',
    requirement: (stats) => stats.maxWave >= 20,
  },

  // 击杀成就
  {
    id: 'killer_50',
    name: '猎杀者',
    description: '击杀50个敌人',
    icon: '⚔️',
    requirement: (stats) => stats.totalKills >= 50,
  },
  {
    id: 'killer_200',
    name: '死神降临',
    description: '击杀200个敌人',
    icon: '💀',
    requirement: (stats) => stats.totalKills >= 200,
  },
  {
    id: 'killer_500',
    name: '战场主宰',
    description: '击杀500个敌人',
    icon: '🗡️',
    requirement: (stats) => stats.totalKills >= 500,
  },

  // 敌人类型成就
  {
    id: 'fast_hunter',
    name: '疾风猎人',
    description: '击杀30个快速敌人',
    icon: '🏃',
    requirement: (stats) => (stats.enemyKills['fast'] || 0) >= 30,
  },
  {
    id: 'tank_buster',
    name: '破甲专家',
    description: '击杀20个坦克敌人',
    icon: '🛡️',
    requirement: (stats) => (stats.enemyKills['tank'] || 0) >= 20,
  },

  // 忍术成就
  {
    id: 'fire_master',
    name: '火遁大师',
    description: '使用火遁50次',
    icon: '🔥',
    requirement: (stats) => (stats.jutsusUsed['fireball'] || 0) >= 50,
  },
  {
    id: 'combo_jutsu',
    name: '组合技大师',
    description: '使用组合忍术10次',
    icon: '✨',
    requirement: (stats) => {
      const comboJutsus = ['fire_thunder_combo', 'water_wind_combo', 'earth_fire_combo', 'thunder_water_combo'];
      return comboJutsus.reduce((sum, id) => sum + (stats.jutsusUsed[id] || 0), 0) >= 10;
    },
  },

  // 特殊成就
  {
    id: 'persistent',
    name: '永不放弃',
    description: '游玩10场游戏',
    icon: '💪',
    requirement: (stats) => stats.gamesPlayed >= 10,
  },
];

class AchievementService {
  private achievements: Map<string, Achievement> = new Map();
  private stats: PlayerStats = {
    totalScore: 0,
    maxCombo: 0,
    maxWave: 0,
    totalKills: 0,
    jutsusUsed: {},
    enemyKills: {},
    gamesPlayed: 0,
  };
  private onUnlockCallbacks: ((achievement: Achievement) => void)[] = [];

  constructor() {
    // 初始化成就
    ACHIEVEMENT_DEFINITIONS.forEach(def => {
      this.achievements.set(def.id, {
        ...def,
        unlocked: false,
      });
    });

    // 从localStorage加载存档
    this.loadFromStorage();
  }

  // 注册成就解锁回调
  onUnlock(callback: (achievement: Achievement) => void) {
    this.onUnlockCallbacks.push(callback);
  }

  // 更新统计数据
  updateStats(updates: Partial<PlayerStats>) {
    // 累加类型
    if (updates.totalScore !== undefined) {
      this.stats.totalScore = Math.max(this.stats.totalScore, updates.totalScore);
    }
    if (updates.maxCombo !== undefined) {
      this.stats.maxCombo = Math.max(this.stats.maxCombo, updates.maxCombo);
    }
    if (updates.maxWave !== undefined) {
      this.stats.maxWave = Math.max(this.stats.maxWave, updates.maxWave);
    }
    if (updates.totalKills !== undefined) {
      this.stats.totalKills += updates.totalKills;
    }
    if (updates.gamesPlayed !== undefined) {
      this.stats.gamesPlayed += updates.gamesPlayed;
    }

    // 字典类型
    if (updates.jutsusUsed) {
      Object.entries(updates.jutsusUsed).forEach(([key, value]) => {
        this.stats.jutsusUsed[key] = (this.stats.jutsusUsed[key] || 0) + (value as number);
      });
    }
    if (updates.enemyKills) {
      Object.entries(updates.enemyKills).forEach(([key, value]) => {
        this.stats.enemyKills[key] = (this.stats.enemyKills[key] || 0) + (value as number);
      });
    }

    // 检查成就
    this.checkAchievements();
    this.saveToStorage();
  }

  // 检查成就解锁
  private checkAchievements() {
    this.achievements.forEach((achievement) => {
      if (!achievement.unlocked && achievement.requirement(this.stats)) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        this.onUnlockCallbacks.forEach(cb => cb(achievement));
      }
    });
  }

  // 获取所有成就
  getAllAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  // 获取已解锁成就
  getUnlockedAchievements(): Achievement[] {
    return this.getAllAchievements().filter(a => a.unlocked);
  }

  // 获取进度
  getProgress(): { unlocked: number; total: number } {
    const all = this.getAllAchievements();
    const unlocked = all.filter(a => a.unlocked).length;
    return { unlocked, total: all.length };
  }

  // 获取统计数据
  getStats(): PlayerStats {
    return { ...this.stats };
  }

  // 保存到localStorage
  private saveToStorage() {
    try {
      const data = {
        stats: this.stats,
        achievements: Array.from(this.achievements.entries()).map(([id, a]) => ({
          id,
          unlocked: a.unlocked,
          unlockedAt: a.unlockedAt,
        })),
      };
      localStorage.setItem('naruto_achievements', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save achievements:', e);
    }
  }

  // 从localStorage加载
  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('naruto_achievements');
      if (saved) {
        const data = JSON.parse(saved);
        this.stats = { ...this.stats, ...data.stats };
        data.achievements.forEach((saved: { id: string; unlocked: boolean; unlockedAt?: number }) => {
          const achievement = this.achievements.get(saved.id);
          if (achievement) {
            achievement.unlocked = saved.unlocked;
            achievement.unlockedAt = saved.unlockedAt;
          }
        });
      }
    } catch (e) {
      console.error('Failed to load achievements:', e);
    }
  }

  // 重置成就（调试用）
  reset() {
    this.stats = {
      totalScore: 0,
      maxCombo: 0,
      maxWave: 0,
      totalKills: 0,
      jutsusUsed: {},
      enemyKills: {},
      gamesPlayed: 0,
    };
    this.achievements.forEach(a => {
      a.unlocked = false;
      a.unlockedAt = undefined;
    });
    localStorage.removeItem('naruto_achievements');
  }
}

export const achievementService = new AchievementService();
