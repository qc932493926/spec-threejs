/**
 * 挑战模式系统
 * 提供多种游戏挑战模式
 */

/**
 * 挑战模式类型
 */
export type ChallengeType =
  | 'time_attack'      // 限时挑战
  | 'survival'         // 生存模式
  | 'boss_rush'        // Boss连战
  | 'no_chakra'        // 零查克拉挑战
  | 'combo_master'     // 连击大师
  | 'precision'        // 精准打击
  | 'endless';         // 无尽模式

/**
 * 挑战难度
 */
export type ChallengeDifficulty = 'easy' | 'normal' | 'hard' | 'nightmare' | 'hell';

/**
 * 挑战规则
 */
export interface ChallengeRules {
  timeLimit?: number;           // 时间限制(秒)
  maxChakra?: number;           // 最大查克拉
  chakraRegenRate?: number;     // 查克拉恢复率
  enemySpawnRate?: number;      // 敌人生成速率倍数
  enemyHealthMod?: number;      // 敌人血量修正
  enemyDamageMod?: number;      // 敌人伤害修正
  bossCount?: number;           // Boss数量
  comboTimeWindow?: number;     // 连击时间窗口(毫秒)
  allowedJutsu?: string[];      // 允许使用的忍术
  bannedJutsu?: string[];       // 禁用的忍术
  targetScore?: number;         // 目标分数
  targetCombo?: number;         // 目标连击
  wavesToComplete?: number;     // 需要完成的波次
}

/**
 * 挑战定义
 */
export interface Challenge {
  id: string;
  type: ChallengeType;
  name: string;
  description: string;
  difficulty: ChallengeDifficulty;
  rules: ChallengeRules;
  // 奖励
  rewards: ChallengeRewards;
  // 解锁条件
  unlockCondition?: UnlockCondition;
  // 排行榜ID
  leaderboardId: string;
}

/**
 * 挑战奖励
 */
export interface ChallengeRewards {
  score: number;                // 基础分数
  items?: string[];             // 奖励道具
  achievements?: string[];      // 解锁成就
  unlockChallenges?: string[];  // 解锁的挑战
}

/**
 * 解锁条件
 */
export interface UnlockCondition {
  type: 'wave' | 'score' | 'combo' | 'achievement' | 'challenge';
  value: number | string;
}

/**
 * 挑战进度
 */
export interface ChallengeProgress {
  challengeId: string;
  bestScore: number;
  bestTime: number;
  completed: boolean;
  completedAt?: number;
  attempts: number;
}

/**
 * 挑战配置表
 */
export const challengeConfigs: Challenge[] = [
  // ========== 限时挑战 ==========
  {
    id: 'time_attack_1',
    type: 'time_attack',
    name: '限时挑战：初阵',
    description: '在60秒内尽可能获得高分',
    difficulty: 'easy',
    rules: {
      timeLimit: 60,
      enemySpawnRate: 1.5
    },
    rewards: {
      score: 1000,
      items: ['chakra_potion_small']
    },
    leaderboardId: 'time_attack_1'
  },
  {
    id: 'time_attack_2',
    type: 'time_attack',
    name: '限时挑战：疾风',
    description: '在90秒内达到10000分',
    difficulty: 'normal',
    rules: {
      timeLimit: 90,
      targetScore: 10000,
      enemySpawnRate: 2
    },
    rewards: {
      score: 3000,
      items: ['chakra_potion_medium', 'soldier_pill']
    },
    leaderboardId: 'time_attack_2'
  },
  {
    id: 'time_attack_3',
    type: 'time_attack',
    name: '限时挑战：雷切',
    description: '在120秒内达到30000分',
    difficulty: 'hard',
    rules: {
      timeLimit: 120,
      targetScore: 30000,
      enemySpawnRate: 2.5,
      enemyHealthMod: 1.5
    },
    rewards: {
      score: 8000,
      items: ['chakra_potion_large', 'kunai_explosive']
    },
    unlockCondition: { type: 'challenge', value: 'time_attack_2' },
    leaderboardId: 'time_attack_3'
  },

  // ========== 生存模式 ==========
  {
    id: 'survival_1',
    type: 'survival',
    name: '生存模式：坚持',
    description: '生存10个波次',
    difficulty: 'normal',
    rules: {
      wavesToComplete: 10,
      chakraRegenRate: 0.5
    },
    rewards: {
      score: 5000,
      items: ['ramen', 'chakra_potion_medium']
    },
    leaderboardId: 'survival_1'
  },
  {
    id: 'survival_2',
    type: 'survival',
    name: '生存模式：忍耐',
    description: '生存20个波次，敌人更强',
    difficulty: 'hard',
    rules: {
      wavesToComplete: 20,
      chakraRegenRate: 0.3,
      enemyHealthMod: 1.5,
      enemyDamageMod: 1.5
    },
    rewards: {
      score: 15000,
      items: ['vest_anbu', 'accessory_amulet']
    },
    unlockCondition: { type: 'challenge', value: 'survival_1' },
    leaderboardId: 'survival_2'
  },
  {
    id: 'survival_3',
    type: 'survival',
    name: '生存模式：极限',
    description: '生存30个波次，查克拉恢复极低',
    difficulty: 'nightmare',
    rules: {
      wavesToComplete: 30,
      chakraRegenRate: 0.1,
      enemyHealthMod: 2,
      enemyDamageMod: 2
    },
    rewards: {
      score: 30000,
      items: ['headband_jonin']
    },
    unlockCondition: { type: 'challenge', value: 'survival_2' },
    leaderboardId: 'survival_3'
  },

  // ========== Boss连战 ==========
  {
    id: 'boss_rush_1',
    type: 'boss_rush',
    name: 'Boss连战：试炼',
    description: '连续击败2个Boss',
    difficulty: 'hard',
    rules: {
      bossCount: 2,
      maxChakra: 100
    },
    rewards: {
      score: 10000,
      items: ['chakra_potion_large']
    },
    unlockCondition: { type: 'wave', value: 10 },
    leaderboardId: 'boss_rush_1'
  },
  {
    id: 'boss_rush_2',
    type: 'boss_rush',
    name: 'Boss连战：修罗',
    description: '连续击败4个Boss，没有恢复',
    difficulty: 'nightmare',
    rules: {
      bossCount: 4,
      maxChakra: 80,
      chakraRegenRate: 0
    },
    rewards: {
      score: 25000,
      items: ['sword_samehada']
    },
    unlockCondition: { type: 'challenge', value: 'boss_rush_1' },
    leaderboardId: 'boss_rush_2'
  },
  {
    id: 'boss_rush_3',
    type: 'boss_rush',
    name: 'Boss连战：地狱',
    description: '连续击败全部6个Boss',
    difficulty: 'hell',
    rules: {
      bossCount: 6,
      maxChakra: 50,
      chakraRegenRate: 0
    },
    rewards: {
      score: 50000,
      items: ['accessory_sharingan']
    },
    unlockCondition: { type: 'challenge', value: 'boss_rush_2' },
    leaderboardId: 'boss_rush_3'
  },

  // ========== 零查克拉挑战 ==========
  {
    id: 'no_chakra_1',
    type: 'no_chakra',
    name: '零查克拉：克制',
    description: '查克拉上限50，完成5波',
    difficulty: 'hard',
    rules: {
      wavesToComplete: 5,
      maxChakra: 50
    },
    rewards: {
      score: 8000,
      items: ['chakra_potion_medium']
    },
    leaderboardId: 'no_chakra_1'
  },
  {
    id: 'no_chakra_2',
    type: 'no_chakra',
    name: '零查克拉：极限',
    description: '查克拉上限30，完成10波',
    difficulty: 'nightmare',
    rules: {
      wavesToComplete: 10,
      maxChakra: 30
    },
    rewards: {
      score: 20000,
      items: ['headband_jonin', 'vest_anbu']
    },
    unlockCondition: { type: 'challenge', value: 'no_chakra_1' },
    leaderboardId: 'no_chakra_2'
  },

  // ========== 连击大师 ==========
  {
    id: 'combo_master_1',
    type: 'combo_master',
    name: '连击大师：入门',
    description: '达到50连击',
    difficulty: 'normal',
    rules: {
      targetCombo: 50,
      comboTimeWindow: 3000
    },
    rewards: {
      score: 3000,
      items: ['accessory_scroll']
    },
    leaderboardId: 'combo_master_1'
  },
  {
    id: 'combo_master_2',
    type: 'combo_master',
    name: '连击大师：精通',
    description: '达到100连击',
    difficulty: 'hard',
    rules: {
      targetCombo: 100,
      comboTimeWindow: 2000
    },
    rewards: {
      score: 10000,
      items: ['accessory_amulet']
    },
    unlockCondition: { type: 'challenge', value: 'combo_master_1' },
    leaderboardId: 'combo_master_2'
  },
  {
    id: 'combo_master_3',
    type: 'combo_master',
    name: '连击大师：传说',
    description: '达到200连击，时间窗口更短',
    difficulty: 'hell',
    rules: {
      targetCombo: 200,
      comboTimeWindow: 1500
    },
    rewards: {
      score: 30000,
      items: ['accessory_sharingan']
    },
    unlockCondition: { type: 'challenge', value: 'combo_master_2' },
    leaderboardId: 'combo_master_3'
  },

  // ========== 精准打击 ==========
  {
    id: 'precision_1',
    type: 'precision',
    name: '精准打击：练习',
    description: '只能使用单印忍术完成5波',
    difficulty: 'normal',
    rules: {
      wavesToComplete: 5,
      allowedJutsu: ['fireball', 'water_dragon', 'lightning', 'wind_blade', 'earth_wall']
    },
    rewards: {
      score: 5000,
      items: ['kunai_basic']
    },
    leaderboardId: 'precision_1'
  },
  {
    id: 'precision_2',
    type: 'precision',
    name: '精准打击：专注',
    description: '只能使用二印忍术完成8波',
    difficulty: 'hard',
    rules: {
      wavesToComplete: 8,
      allowedJutsu: ['fire_thunder_combo', 'water_wind_combo', 'earth_fire_combo', 'thunder_water_combo']
    },
    rewards: {
      score: 12000,
      items: ['kunai_explosive']
    },
    unlockCondition: { type: 'challenge', value: 'precision_1' },
    leaderboardId: 'precision_2'
  },

  // ========== 无尽模式 ==========
  {
    id: 'endless_1',
    type: 'endless',
    name: '无尽模式：挑战',
    description: '没有终点的战斗，坚持到极限',
    difficulty: 'normal',
    rules: {
      enemySpawnRate: 1,
      chakraRegenRate: 1
    },
    rewards: {
      score: 0 // 根据波次计算
    },
    unlockCondition: { type: 'wave', value: 5 },
    leaderboardId: 'endless_1'
  },
  {
    id: 'endless_2',
    type: 'endless',
    name: '无尽模式：噩梦',
    description: '更强的敌人，更少的资源',
    difficulty: 'nightmare',
    rules: {
      enemySpawnRate: 1.5,
      enemyHealthMod: 2,
      chakraRegenRate: 0.5
    },
    rewards: {
      score: 0
    },
    unlockCondition: { type: 'challenge', value: 'endless_1' },
    leaderboardId: 'endless_2'
  }
];

/**
 * 获取挑战配置
 */
export function getChallengeConfig(challengeId: string): Challenge | undefined {
  return challengeConfigs.find(c => c.id === challengeId);
}

/**
 * 获取指定类型的所有挑战
 */
export function getChallengesByType(type: ChallengeType): Challenge[] {
  return challengeConfigs.filter(c => c.type === type);
}

/**
 * 获取指定难度的所有挑战
 */
export function getChallengesByDifficulty(difficulty: ChallengeDifficulty): Challenge[] {
  return challengeConfigs.filter(c => c.difficulty === difficulty);
}

/**
 * 检查挑战是否解锁
 */
export function isChallengeUnlocked(challenge: Challenge, progress: ChallengeProgress[], achievements: string[]): boolean {
  if (!challenge.unlockCondition) return true;

  const condition = challenge.unlockCondition;

  switch (condition.type) {
    case 'wave':
      // 需要检查玩家最大波次
      return true; // 由外部提供
    case 'score':
      // 需要检查玩家最高分
      return true;
    case 'combo':
      // 需要检查玩家最大连击
      return true;
    case 'achievement':
      return achievements.includes(condition.value as string);
    case 'challenge':
      return progress.some(p => p.challengeId === condition.value && p.completed);
    default:
      return false;
  }
}

/**
 * 创建挑战进度记录
 */
export function createChallengeProgress(challengeId: string): ChallengeProgress {
  return {
    challengeId,
    bestScore: 0,
    bestTime: 0,
    completed: false,
    attempts: 0
  };
}

/**
 * 更新挑战进度
 */
export function updateChallengeProgress(
  progress: ChallengeProgress,
  score: number,
  time: number,
  completed: boolean
): ChallengeProgress {
  return {
    ...progress,
    bestScore: Math.max(progress.bestScore, score),
    bestTime: progress.bestTime === 0 ? time : Math.min(progress.bestTime, time),
    completed: progress.completed || completed,
    completedAt: completed ? Date.now() : progress.completedAt,
    attempts: progress.attempts + 1
  };
}

/**
 * 计算挑战最终分数
 */
export function calculateChallengeScore(challenge: Challenge, baseScore: number, timeBonus: number): number {
  const difficultyMultiplier: Record<ChallengeDifficulty, number> = {
    easy: 1,
    normal: 1.5,
    hard: 2,
    nightmare: 3,
    hell: 5
  };

  const multiplier = difficultyMultiplier[challenge.difficulty];
  return Math.floor((baseScore + timeBonus) * multiplier);
}
