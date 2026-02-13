/**
 * 游戏平衡性配置
 * v177: 综合平衡性调整
 */

/**
 * 核心游戏参数
 */
export const GAME_BALANCE = {
  // 查克拉系统
  chakra: {
    maxBase: 100,              // 基础最大查克拉
    regenRate: 5,              // 每秒恢复量
    regenInterval: 1000,       // 恢复间隔(毫秒)
    comboRegenBonus: 0.5,      // 每连击额外恢复加成
    waveRegenBonus: 2,         // 每波次额外恢复加成
  },

  // 连击系统
  combo: {
    timeWindow: 2500,          // 连击时间窗口(毫秒)
    scoreMultiplier: 0.1,      // 每连击分数加成(10%)
    maxMultiplier: 5,          // 最大连击倍率(500%)
    perfectThreshold: 100,     // 完美连击阈值
  },

  // 分数系统
  score: {
    enemyBaseKill: 100,        // 基础击杀分数
    bossMultiplier: 10,        // Boss分数倍率
    waveBonus: 500,            // 波次完成奖励
    comboBonus: 50,            // 连击奖励基础值
    perfectComboBonus: 1000,   // 完美连击奖励
  },

  // 敌人难度曲线
  enemy: {
    healthBase: 1,
    healthPerWave: 0.5,        // 每波次血量增长
    speedBase: 5,
    speedPerWave: 0.3,         // 每波次速度增长
    spawnIntervalBase: 2,      // 基础生成间隔(秒)
    spawnIntervalMin: 0.5,     // 最小生成间隔
    spawnIntervalReduction: 0.1, // 每波次间隔减少
  },

  // Boss平衡
  boss: {
    healthMultiplier: 50,      // Boss血量倍率
    armorBase: 10,             // 基础护甲
    armorPerLevel: 5,          // 每等级护甲增长
    skillDamageMultiplier: 2,  // Boss技能伤害倍率
    waveInterval: 5,           // Boss出现间隔(每N波)
  },

  // 忍术平衡
  jutsu: {
    damageBase: 25,            // 单印基础伤害
    damagePerSeal: 15,         // 每额外印记伤害增加
    cooldownBase: 1000,        // 基础冷却(毫秒)
    cooldownPerSeal: 500,      // 每额外印记冷却增加
    chakraCostBase: 15,        // 基础查克拉消耗
    chakraCostPerSeal: 10,     // 每额外印记消耗增加
  },

  // 道具掉落
  drop: {
    baseRate: 0.1,             // 基础掉落率(10%)
    bossDropRate: 1,           // Boss必定掉落
    rareChance: 0.2,           // 稀有道具概率
    epicChance: 0.05,          // 史诗道具概率
    legendaryChance: 0.01,     // 传说道具概率
  },

  // 稀有度倍率
  rarity: {
    common: { damage: 1, cost: 1, cooldown: 1 },
    rare: { damage: 1.2, cost: 1.1, cooldown: 0.95 },
    epic: { damage: 1.5, cost: 1.2, cooldown: 0.9 },
    legendary: { damage: 2, cost: 1.3, cooldown: 0.85 },
    mythic: { damage: 3, cost: 1.5, cooldown: 0.8 },
  },

  // 挑战模式难度修正
  difficulty: {
    easy: { enemyHp: 0.7, enemyDamage: 0.7, chakraRegen: 1.5 },
    normal: { enemyHp: 1, enemyDamage: 1, chakraRegen: 1 },
    hard: { enemyHp: 1.5, enemyDamage: 1.3, chakraRegen: 0.8 },
    nightmare: { enemyHp: 2, enemyDamage: 1.8, chakraRegen: 0.5 },
    hell: { enemyHp: 3, enemyDamage: 2.5, chakraRegen: 0.3 },
  }
};

/**
 * 忍术伤害计算
 */
export function calculateJutsuDamage(
  baseDamage: number,
  sealCount: number,
  rarity: keyof typeof GAME_BALANCE.rarity,
  bonusDamage: number = 0
): number {
  const rarityMultiplier = GAME_BALANCE.rarity[rarity].damage;
  const sealBonus = sealCount * GAME_BALANCE.jutsu.damagePerSeal;
  return Math.floor((baseDamage + sealBonus + bonusDamage) * rarityMultiplier);
}

/**
 * 忍术冷却计算
 */
export function calculateJutsuCooldown(
  baseCooldown: number,
  rarity: keyof typeof GAME_BALANCE.rarity,
  cooldownReduction: number = 0
): number {
  const rarityMultiplier = GAME_BALANCE.rarity[rarity].cooldown;
  const reduced = baseCooldown * rarityMultiplier * (1 - cooldownReduction / 100);
  return Math.max(500, Math.floor(reduced)); // 最小500ms
}

/**
 * 敌人血量计算
 */
export function calculateEnemyHealth(wave: number, isBoss: boolean = false): number {
  const baseHealth = GAME_BALANCE.enemy.healthBase;
  const waveBonus = wave * GAME_BALANCE.enemy.healthPerWave;

  if (isBoss) {
    return Math.floor((baseHealth + waveBonus) * GAME_BALANCE.boss.healthMultiplier);
  }

  return Math.floor(baseHealth + waveBonus);
}

/**
 * 敌人生成间隔计算
 */
export function calculateSpawnInterval(wave: number): number {
  const base = GAME_BALANCE.enemy.spawnIntervalBase;
  const reduction = wave * GAME_BALANCE.enemy.spawnIntervalReduction;
  return Math.max(GAME_BALANCE.enemy.spawnIntervalMin, base - reduction);
}

/**
 * 分数计算
 */
export function calculateScore(
  enemyKill: boolean,
  isBoss: boolean,
  combo: number,
  wave: number
): number {
  let score = 0;

  if (enemyKill) {
    const baseScore = GAME_BALANCE.score.enemyBaseKill;
    score = isBoss ? baseScore * GAME_BALANCE.score.bossMultiplier : baseScore;
  }

  // 连击加成
  if (combo > 1) {
    const comboMultiplier = Math.min(
      1 + combo * GAME_BALANCE.combo.scoreMultiplier,
      GAME_BALANCE.combo.maxMultiplier
    );
    score = Math.floor(score * comboMultiplier);
  }

  // 波次加成
  score += wave * 10;

  return score;
}

/**
 * 道具掉落判定
 */
export function rollItemDrop(isBoss: boolean): { drop: boolean; rarity: keyof typeof GAME_BALANCE.rarity } {
  const roll = Math.random();
  const dropRate = isBoss ? GAME_BALANCE.drop.bossDropRate : GAME_BALANCE.drop.baseRate;

  if (roll > dropRate) {
    return { drop: false, rarity: 'common' };
  }

  // 稀有度判定
  const rarityRoll = Math.random();
  if (rarityRoll < GAME_BALANCE.drop.legendaryChance) {
    return { drop: true, rarity: 'legendary' };
  } else if (rarityRoll < GAME_BALANCE.drop.epicChance) {
    return { drop: true, rarity: 'epic' };
  } else if (rarityRoll < GAME_BALANCE.drop.rareChance) {
    return { drop: true, rarity: 'rare' };
  }

  return { drop: true, rarity: 'common' };
}

/**
 * 查克拉恢复计算
 */
export function calculateChakraRegen(
  baseRegen: number,
  combo: number,
  wave: number,
  regenBonus: number = 0
): number {
  const comboBonus = combo * GAME_BALANCE.chakra.comboRegenBonus;
  const waveBonus = wave * GAME_BALANCE.chakra.waveRegenBonus;
  return Math.floor((baseRegen + comboBonus + waveBonus) * (1 + regenBonus / 100));
}

/**
 * 获取难度修正
 */
export function getDifficultyModifiers(difficulty: keyof typeof GAME_BALANCE.difficulty) {
  return GAME_BALANCE.difficulty[difficulty];
}

/**
 * 伤害计算（考虑护甲）
 */
export function calculateDamageWithArmor(damage: number, armor: number): number {
  // 护甲减伤公式：减伤百分比 = 护甲 / (护甲 + 100)
  const reduction = armor / (armor + 100);
  return Math.max(1, Math.floor(damage * (1 - reduction)));
}
