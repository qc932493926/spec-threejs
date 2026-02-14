/**
 * v176: 高级教程服务
 * 提供进阶玩家的高级技巧训练关卡
 */

// 高级教程关卡定义
export interface AdvancedTutorialLevel {
  id: string;
  name: string;
  description: string;
  difficulty: 'intermediate' | 'advanced' | 'master';
  category: 'combo' | 'jutsu' | 'defense' | 'boss' | 'efficiency';
  objectives: TutorialObjective[];
  rewards: TutorialReward;
  tips: string[];
  requiredLevel?: string; // 前置关卡
}

// 教程目标
export interface TutorialObjective {
  id: string;
  description: string;
  target: number;
  type: 'kill' | 'combo' | 'jutsu' | 'survive' | 'score' | 'time' | 'perfect';
  jutsuId?: string; // 特定忍术
}

// 教程奖励
export interface TutorialReward {
  score: number;
  achievement?: string;
  unlockJutsu?: string;
}

// 高级教程关卡列表
export const advancedTutorialLevels: AdvancedTutorialLevel[] = [
  // ========== 中级教程 ==========
  {
    id: 'combo_basics',
    name: '连击基础',
    description: '学习如何维持和提升连击数',
    difficulty: 'intermediate',
    category: 'combo',
    objectives: [
      { id: 'combo_10', description: '达成10连击', target: 10, type: 'combo' },
      { id: 'combo_20', description: '达成20连击', target: 20, type: 'combo' },
    ],
    rewards: { score: 500 },
    tips: [
      '快速释放忍术可以维持连击',
      '使用低查克拉消耗的忍术更易维持连击',
      '注意连击计时器，不要让它归零',
    ],
  },
  {
    id: 'element_mastery',
    name: '元素精通',
    description: '掌握五种基础元素的忍术',
    difficulty: 'intermediate',
    category: 'jutsu',
    objectives: [
      { id: 'fire_use', description: '使用火遁忍术3次', target: 3, type: 'jutsu', jutsuId: 'fireball' },
      { id: 'water_use', description: '使用水遁忍术3次', target: 3, type: 'jutsu', jutsuId: 'water_dragon' },
      { id: 'lightning_use', description: '使用雷遁忍术3次', target: 3, type: 'jutsu', jutsuId: 'lightning' },
    ],
    rewards: { score: 800 },
    tips: [
      '每种手势对应一种元素',
      '火印->张开手掌，水印->握拳，雷印->食指向上',
    ],
  },
  {
    id: 'defense_timing',
    name: '防御时机',
    description: '学习何时使用防御忍术',
    difficulty: 'intermediate',
    category: 'defense',
    objectives: [
      { id: 'shield_use', description: '成功使用土流壁防御5次', target: 5, type: 'jutsu', jutsuId: 'earth_wall' },
      { id: 'survive', description: '在波次中存活2分钟', target: 120, type: 'survive' },
    ],
    rewards: { score: 600 },
    tips: [
      '土流壁可以减少受到的伤害',
      '注意查克拉消耗，不要过度使用',
    ],
  },

  // ========== 高级教程 ==========
  {
    id: 'combo_master',
    name: '连击大师',
    description: '成为连击高手',
    difficulty: 'advanced',
    category: 'combo',
    requiredLevel: 'combo_basics',
    objectives: [
      { id: 'combo_50', description: '达成50连击', target: 50, type: 'combo' },
      { id: 'perfect_wave', description: '在单波次中不受伤', target: 1, type: 'perfect' },
    ],
    rewards: { score: 1500, achievement: 'combo_master' },
    tips: [
      '使用范围伤害忍术可以快速击杀多个敌人',
      '保持冷静，不要急于释放',
    ],
  },
  {
    id: 'jutsu_combo',
    name: '忍术连携',
    description: '学习组合忍术的释放技巧',
    difficulty: 'advanced',
    category: 'jutsu',
    objectives: [
      { id: 'combo_jutsu', description: '释放火遁·龙火之术', target: 1, type: 'jutsu', jutsuId: 'fire_thunder_combo' },
      { id: 'combo_damage', description: '用组合忍术造成500点伤害', target: 500, type: 'jutsu' },
    ],
    rewards: { score: 1200 },
    tips: [
      '火印+雷印 = 火遁·龙火',
      '组合忍术伤害更高，但需要更多查克拉',
    ],
  },
  {
    id: 'boss_tactics',
    name: 'Boss战术',
    description: '学习击败Boss的技巧',
    difficulty: 'advanced',
    category: 'boss',
    objectives: [
      { id: 'boss_damage', description: '对Boss造成200点伤害', target: 200, type: 'jutsu' },
      { id: 'boss_survive', description: '在Boss战中存活1分钟', target: 60, type: 'survive' },
    ],
    rewards: { score: 2000 },
    tips: [
      'Boss有护甲，普通忍术效果降低',
      '使用带有bonusDamage的忍术更有效',
      '注意躲避Boss技能',
    ],
  },

  // ========== 大师教程 ==========
  {
    id: 'ultimate_mastery',
    name: '终极忍术掌握',
    description: '掌握三印终极忍术',
    difficulty: 'master',
    category: 'jutsu',
    requiredLevel: 'jutsu_combo',
    objectives: [
      { id: 'ultimate_use', description: '释放一次终极忍术', target: 1, type: 'jutsu', jutsuId: 'rasenshuriken_ultimate' },
      { id: 'ultimate_kill', description: '用终极忍术击杀10个敌人', target: 10, type: 'kill' },
    ],
    rewards: { score: 3000, achievement: 'ultimate_master' },
    tips: [
      '风印+火印+雷印 = 风遁·螺旋手里剑·终极',
      '三印忍术需要精确的手势序列',
      '终极忍术消耗大量查克拉',
    ],
  },
  {
    id: 'forbidden_arts',
    name: '禁术之路',
    description: '学习危险的禁术',
    difficulty: 'master',
    category: 'jutsu',
    requiredLevel: 'ultimate_mastery',
    objectives: [
      { id: 'forbidden_use', description: '释放一次禁术', target: 1, type: 'jutsu', jutsuId: 'shinra_tensei' },
      { id: 'high_score', description: '在单局中获得5000分', target: 5000, type: 'score' },
    ],
    rewards: { score: 5000, achievement: 'forbidden_user' },
    tips: [
      '四印禁术是最强大的忍术',
      '神罗天征: 风印+火印+雷印+土印',
      '禁术有极长的冷却时间',
    ],
  },
  {
    id: 'speed_run',
    name: '速通挑战',
    description: '在最短时间内完成目标',
    difficulty: 'master',
    category: 'efficiency',
    objectives: [
      { id: 'fast_50kills', description: '30秒内击杀50个敌人', target: 50, type: 'kill' },
      { id: 'time_limit', description: '在限时内完成', target: 30, type: 'time' },
    ],
    rewards: { score: 4000, achievement: 'speed_demon' },
    tips: [
      '使用范围伤害忍术效率最高',
      '保持高连击以获得分数加成',
    ],
  },
  {
    id: 'perfectionist',
    name: '完美主义者',
    description: '完成完美波次挑战',
    difficulty: 'master',
    category: 'efficiency',
    objectives: [
      { id: 'perfect_5', description: '连续5波不受伤', target: 5, type: 'perfect' },
      { id: 'combo_100', description: '达成100连击', target: 100, type: 'combo' },
    ],
    rewards: { score: 8000, achievement: 'perfectionist' },
    tips: [
      '使用防御忍术保护自己',
      '控制节奏，不要贪心',
      '保持查克拉储备应对紧急情况',
    ],
  },
];

/**
 * 高级教程服务类
 */
class AdvancedTutorialService {
  private currentLevel: AdvancedTutorialLevel | null = null;
  private progress: Map<string, TutorialObjective[]> = new Map();
  private completedLevels: Set<string> = new Set();

  /**
   * 初始化服务
   */
  initialize(): void {
    this.loadProgress();
  }

  /**
   * 获取所有关卡
   */
  getAllLevels(): AdvancedTutorialLevel[] {
    return advancedTutorialLevels;
  }

  /**
   * 获取指定难度的关卡
   */
  getLevelsByDifficulty(difficulty: 'intermediate' | 'advanced' | 'master'): AdvancedTutorialLevel[] {
    return advancedTutorialLevels.filter(level => level.difficulty === difficulty);
  }

  /**
   * 获取指定类别的关卡
   */
  getLevelsByCategory(category: 'combo' | 'jutsu' | 'defense' | 'boss' | 'efficiency'): AdvancedTutorialLevel[] {
    return advancedTutorialLevels.filter(level => level.category === category);
  }

  /**
   * 开始关卡
   */
  startLevel(levelId: string): AdvancedTutorialLevel | null {
    const level = advancedTutorialLevels.find(l => l.id === levelId);
    if (!level) return null;

    // 检查前置条件
    if (level.requiredLevel && !this.completedLevels.has(level.requiredLevel)) {
      return null;
    }

    this.currentLevel = level;
    // 初始化目标进度
    this.progress.set(levelId, level.objectives.map(obj => ({ ...obj, current: 0 } as any)));

    return level;
  }

  /**
   * 获取当前关卡
   */
  getCurrentLevel(): AdvancedTutorialLevel | null {
    return this.currentLevel;
  }

  /**
   * 更新目标进度
   */
  updateObjective(objectiveId: string, value: number): boolean {
    if (!this.currentLevel) return false;

    const objectives = this.progress.get(this.currentLevel.id);
    if (!objectives) return false;

    const objective = objectives.find(o => o.id === objectiveId);
    if (!objective) return false;

    (objective as any).current = Math.min(value, objective.target);
    return (objective as any).current >= objective.target;
  }

  /**
   * 增加目标进度
   */
  incrementObjective(objectiveId: string, amount: number = 1): boolean {
    if (!this.currentLevel) return false;

    const objectives = this.progress.get(this.currentLevel.id);
    if (!objectives) return false;

    const objective = objectives.find(o => o.id === objectiveId);
    if (!objective) return false;

    const current = (objective as any).current || 0;
    (objective as any).current = Math.min(current + amount, objective.target);
    return (objective as any).current >= objective.target;
  }

  /**
   * 检查关卡是否完成
   */
  checkLevelComplete(): boolean {
    if (!this.currentLevel) return false;

    const objectives = this.progress.get(this.currentLevel.id);
    if (!objectives) return false;

    return objectives.every(obj => (obj as any).current >= obj.target);
  }

  /**
   * 获取关卡进度
   */
  getLevelProgress(levelId: string): { completed: number; total: number } {
    const objectives = this.progress.get(levelId);
    if (!objectives) {
      const level = advancedTutorialLevels.find(l => l.id === levelId);
      return { completed: 0, total: level?.objectives.length || 0 };
    }

    const completed = objectives.filter(obj => (obj as any).current >= obj.target).length;
    return { completed, total: objectives.length };
  }

  /**
   * 完成当前关卡
   */
  completeCurrentLevel(): TutorialReward | null {
    if (!this.currentLevel || !this.checkLevelComplete()) {
      return null;
    }

    const reward = this.currentLevel.rewards;
    this.completedLevels.add(this.currentLevel.id);
    this.saveProgress();
    this.currentLevel = null;

    return reward;
  }

  /**
   * 退出当前关卡
   */
  exitLevel(): void {
    this.currentLevel = null;
  }

  /**
   * 检查关卡是否已解锁
   */
  isLevelUnlocked(levelId: string): boolean {
    const level = advancedTutorialLevels.find(l => l.id === levelId);
    if (!level) return false;

    if (!level.requiredLevel) return true;
    return this.completedLevels.has(level.requiredLevel);
  }

  /**
   * 检查关卡是否已完成
   */
  isLevelCompleted(levelId: string): boolean {
    return this.completedLevels.has(levelId);
  }

  /**
   * 获取总体进度
   */
  getOverallProgress(): { completed: number; total: number } {
    return {
      completed: this.completedLevels.size,
      total: advancedTutorialLevels.length,
    };
  }

  /**
   * 保存进度到localStorage
   */
  private saveProgress(): void {
    try {
      const data = {
        completedLevels: Array.from(this.completedLevels),
        progress: Array.from(this.progress.entries()).map(([key, value]) => ({
          levelId: key,
          objectives: value,
        })),
      };
      localStorage.setItem('advanced_tutorial_progress', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save tutorial progress:', error);
    }
  }

  /**
   * 从localStorage加载进度
   */
  private loadProgress(): void {
    try {
      const data = localStorage.getItem('advanced_tutorial_progress');
      if (data) {
        const parsed = JSON.parse(data);
        this.completedLevels = new Set(parsed.completedLevels || []);

        if (parsed.progress) {
          parsed.progress.forEach((item: { levelId: string; objectives: any[] }) => {
            this.progress.set(item.levelId, item.objectives);
          });
        }
      }
    } catch (error) {
      console.error('Failed to load tutorial progress:', error);
    }
  }

  /**
   * 重置所有进度
   */
  resetProgress(): void {
    this.completedLevels.clear();
    this.progress.clear();
    this.currentLevel = null;
    localStorage.removeItem('advanced_tutorial_progress');
  }
}

// 导出单例
export const advancedTutorialService = new AdvancedTutorialService();
