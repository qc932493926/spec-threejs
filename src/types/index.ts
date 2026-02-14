import * as THREE from 'three';

// 手势类型
export type SealType = '火印' | '水印' | '雷印' | '风印' | '土印';
export type GestureType = 'Open_Palm' | 'Closed_Fist' | 'Pointing_Up' | 'Thumb_Up' | 'Victory' | 'None';

// 手势检测结果
export interface HandGesture {
  type: GestureType;
  sealType: SealType | null;
  position: THREE.Vector2; // 归一化坐标 [0,1]
  confidence: number;
}

// 手势识别结果（MediaPipe）
export interface HandLandmarks {
  landmarks: NormalizedLandmark[];
  worldLandmarks: Landmark[];
  handedness: string; // 'Left' or 'Right'
}

export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

// 忍术定义
export interface Jutsu {
  id: string;
  name: string;
  seals: SealType[]; // 所需手印序列
  chakraCost: number;
  cooldown: number; // 冷却时间（毫秒）
  damage: number;
  effectType: 'projectile' | 'area' | 'shield' | 'buff' | 'debuff' | 'ultimate' | 'forbidden';
  color: THREE.Color;
  // 稀有度
  rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  // 对Boss额外伤害
  bonusDamage?: number;
  // 增益类型
  buffType?: 'attack' | 'defense' | 'speed' | 'chakra' | 'combo' | 'critical' | 'lifesteal' | 'invincible';
  buffDuration?: number; // 增益持续时间（毫秒）
  buffValue?: number; // 增益数值（百分比）
  // v173新增：特殊效果
  aoeRadius?: number; // 范围伤害半径
  chainCount?: number; // 连锁次数
  healPercent?: number; // 生命偷取百分比
  criticalChance?: number; // 暴击几率
  criticalMultiplier?: number; // 暴击倍数
}

// 忍术实例
export interface JutsuInstance {
  jutsu: Jutsu;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  active: boolean;
  mesh?: THREE.Mesh;
  particles?: ParticleEffect;
}

// 粒子特效
export interface ParticleEffect {
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial;
  points: THREE.Points;
  velocities: THREE.Vector3[];
  lifetimes: number[];
  maxLifetime: number;
}

// 敌人
export interface Enemy {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  mesh: THREE.Mesh;
  type: 'basic' | 'fast' | 'tank';
}

// 游戏状态
export interface GameState {
  chakra: number;
  maxChakra: number;
  score: number;
  combo: number;
  comboTimer: number;
  currentSeals: SealType[];
  enemies: Enemy[];
  jutsuInstances: JutsuInstance[];
  isGameOver: boolean;
  wave: number;
}

// 手势映射
export const gestureMapping: Record<GestureType, SealType | null> = {
  'Open_Palm': '火印',
  'Closed_Fist': '水印',
  'Pointing_Up': '雷印',
  'Thumb_Up': '风印',
  'Victory': '土印',
  'None': null
};

// 手势Emoji
export const sealEmojis: Record<SealType, string> = {
  '火印': '🔥',
  '水印': '💧',
  '雷印': '⚡',
  '风印': '💨',
  '土印': '🗿'
};

// 预定义忍术
export const jutsuList: Jutsu[] = [
  // ========== 基础忍术 (单手印) ==========
  {
    id: 'fireball',
    name: '火遁·豪火球之术',
    seals: ['火印'],
    chakraCost: 20,
    cooldown: 1000,
    damage: 30,
    effectType: 'projectile',
    color: new THREE.Color(0xff4500),
    rarity: 'common'
  },
  {
    id: 'water_dragon',
    name: '水遁·水龙弹之术',
    seals: ['水印'],
    chakraCost: 25,
    cooldown: 1500,
    damage: 35,
    effectType: 'projectile',
    color: new THREE.Color(0x1e90ff),
    rarity: 'common'
  },
  {
    id: 'lightning',
    name: '雷遁·千鸟',
    seals: ['雷印'],
    chakraCost: 30,
    cooldown: 2000,
    damage: 50,
    effectType: 'projectile',
    color: new THREE.Color(0x00ffff),
    rarity: 'rare',
    bonusDamage: 20 // 对Boss额外伤害
  },
  {
    id: 'wind_blade',
    name: '风遁·螺旋手里剑',
    seals: ['风印'],
    chakraCost: 15,
    cooldown: 800,
    damage: 25,
    effectType: 'projectile',
    color: new THREE.Color(0x90ee90),
    rarity: 'common'
  },
  {
    id: 'earth_wall',
    name: '土遁·土流壁',
    seals: ['土印'],
    chakraCost: 40,
    cooldown: 3000,
    damage: 0,
    effectType: 'shield',
    color: new THREE.Color(0x8b4513),
    rarity: 'rare',
    buffType: 'defense',
    buffDuration: 5000,
    buffValue: 50 // 减少50%伤害
  },

  // ========== 组合忍术 (双手印) ==========
  {
    id: 'fire_thunder_combo',
    name: '火遁·龙火之术',
    seals: ['火印', '雷印'],
    chakraCost: 50,
    cooldown: 3000,
    damage: 80,
    effectType: 'area',
    color: new THREE.Color(0xff6600),
    rarity: 'rare'
  },
  {
    id: 'water_wind_combo',
    name: '水遁·暴风水龙弹',
    seals: ['水印', '风印'],
    chakraCost: 45,
    cooldown: 2500,
    damage: 70,
    effectType: 'projectile',
    color: new THREE.Color(0x4169e1),
    rarity: 'rare'
  },
  {
    id: 'earth_fire_combo',
    name: '火遁·炎弹',
    seals: ['土印', '火印'],
    chakraCost: 55,
    cooldown: 3500,
    damage: 90,
    effectType: 'area',
    color: new THREE.Color(0xff8c00),
    rarity: 'epic',
    bonusDamage: 30
  },
  {
    id: 'thunder_water_combo',
    name: '雷遁·雷水龙弹',
    seals: ['雷印', '水印'],
    chakraCost: 60,
    cooldown: 4000,
    damage: 100,
    effectType: 'projectile',
    color: new THREE.Color(0x7b68ee),
    rarity: 'epic',
    bonusDamage: 40
  },

  // ========== v51新增：三印终极忍术 ==========
  {
    id: 'rasenshuriken_ultimate',
    name: '风遁·螺旋手里剑·终极',
    seals: ['风印', '火印', '雷印'],
    chakraCost: 80,
    cooldown: 8000,
    damage: 200,
    effectType: 'ultimate',
    color: new THREE.Color(0x00ff88),
    rarity: 'legendary',
    bonusDamage: 100
  },
  {
    id: 'amaterasu',
    name: '天照·黑炎',
    seals: ['火印', '火印', '火印'],
    chakraCost: 100,
    cooldown: 10000,
    damage: 300,
    effectType: 'ultimate',
    color: new THREE.Color(0x1a0a2e),
    rarity: 'legendary',
    bonusDamage: 150
  },
  {
    id: 'kirin',
    name: '雷遁·麒麟',
    seals: ['雷印', '雷印', '火印'],
    chakraCost: 90,
    cooldown: 9000,
    damage: 250,
    effectType: 'ultimate',
    color: new THREE.Color(0xccff00),
    rarity: 'legendary',
    bonusDamage: 120
  },

  // ========== v51新增：辅助型忍术 ==========
  {
    id: 'chakra_regen',
    name: '阳遁·查克拉活性',
    seals: ['火印', '土印'],
    chakraCost: 30,
    cooldown: 15000,
    damage: 0,
    effectType: 'buff',
    color: new THREE.Color(0xffd700),
    rarity: 'rare',
    buffType: 'chakra',
    buffDuration: 10000,
    buffValue: 200 // 查克拉恢复速度+200%
  },
  {
    id: 'shadow_clone_buff',
    name: '多重影分身之术',
    seals: ['风印', '风印'],
    chakraCost: 35,
    cooldown: 12000,
    damage: 0,
    effectType: 'buff',
    color: new THREE.Color(0xffaa00),
    rarity: 'rare',
    buffType: 'attack',
    buffDuration: 8000,
    buffValue: 50 // 攻击力+50%
  },
  {
    id: 'body_flicker',
    name: '瞬身之术',
    seals: ['雷印', '风印'],
    chakraCost: 25,
    cooldown: 6000,
    damage: 0,
    effectType: 'buff',
    color: new THREE.Color(0xccccff),
    rarity: 'common',
    buffType: 'speed',
    buffDuration: 5000,
    buffValue: 100 // 连击时间窗口+100%
  },
  {
    id: 'chakra_armor',
    name: '查克拉护甲',
    seals: ['土印', '土印'],
    chakraCost: 45,
    cooldown: 18000,
    damage: 0,
    effectType: 'buff',
    color: new THREE.Color(0x8b8b00),
    rarity: 'epic',
    buffType: 'defense',
    buffDuration: 12000,
    buffValue: 75 // 伤害减免+75%
  },

  // ========== v51新增：防御穿透型忍术 ==========
  {
    id: 'chidori_blade',
    name: '雷遁·千鸟锐枪',
    seals: ['雷印', '土印'],
    chakraCost: 55,
    cooldown: 4500,
    damage: 75,
    effectType: 'projectile',
    color: new THREE.Color(0x66ffff),
    rarity: 'epic',
    bonusDamage: 80 // 高穿透伤害
  },
  {
    id: 'rasengan_barrage',
    name: '螺旋丸连弹',
    seals: ['风印', '火印'],
    chakraCost: 65,
    cooldown: 5000,
    damage: 120,
    effectType: 'area',
    color: new THREE.Color(0x00aaff),
    rarity: 'epic',
    bonusDamage: 60
  },

  // ========== v173新增：四印禁术 ==========
  {
    id: 'edo_tensei',
    name: '秽土转生·解',
    seals: ['土印', '火印', '水印', '雷印'],
    chakraCost: 150,
    cooldown: 30000,
    damage: 500,
    effectType: 'forbidden',
    color: new THREE.Color(0x4a0080),
    rarity: 'mythic',
    bonusDamage: 300,
    aoeRadius: 15
  },
  {
    id: 'shinra_tensei',
    name: '神罗天征',
    seals: ['风印', '火印', '雷印', '土印'],
    chakraCost: 120,
    cooldown: 25000,
    damage: 400,
    effectType: 'forbidden',
    color: new THREE.Color(0x000033),
    rarity: 'mythic',
    aoeRadius: 20,
    bonusDamage: 200
  },
  {
    id: 'chibaku_tensei',
    name: '地爆天星',
    seals: ['土印', '土印', '雷印', '火印'],
    chakraCost: 180,
    cooldown: 40000,
    damage: 600,
    effectType: 'forbidden',
    color: new THREE.Color(0x1a1a2e),
    rarity: 'mythic',
    aoeRadius: 25,
    bonusDamage: 400
  },
  {
    id: 'tsukuyomi',
    name: '月读',
    seals: ['火印', '雷印', '水印', '土印'],
    chakraCost: 130,
    cooldown: 35000,
    damage: 0,
    effectType: 'debuff',
    color: new THREE.Color(0x6600cc),
    rarity: 'mythic',
    buffType: 'invincible',
    buffDuration: 5000,
    buffValue: 100
  },

  // ========== v173新增：进阶三印忍术 ==========
  {
    id: 'water_shark_dance',
    name: '水遁·水鲛弹之舞',
    seals: ['水印', '水印', '雷印'],
    chakraCost: 70,
    cooldown: 7000,
    damage: 150,
    effectType: 'area',
    color: new THREE.Color(0x0077be),
    rarity: 'legendary',
    aoeRadius: 8,
    chainCount: 3
  },
  {
    id: 'fire_dragon_flame',
    name: '火遁·龙炎啸',
    seals: ['火印', '风印', '火印'],
    chakraCost: 75,
    cooldown: 7500,
    damage: 160,
    effectType: 'projectile',
    color: new THREE.Color(0xff3300),
    rarity: 'legendary',
    bonusDamage: 100,
    criticalChance: 30
  },
  {
    id: 'lightning_armor',
    name: '雷遁·雷遁铠甲',
    seals: ['雷印', '雷印', '土印'],
    chakraCost: 65,
    cooldown: 20000,
    damage: 0,
    effectType: 'buff',
    color: new THREE.Color(0x00ccff),
    rarity: 'legendary',
    buffType: 'invincible',
    buffDuration: 8000,
    buffValue: 80
  },

  // ========== v173新增：增益型忍术扩展 ==========
  {
    id: 'healing_palm',
    name: '掌仙术·活',
    seals: ['水印', '火印'],
    chakraCost: 40,
    cooldown: 20000,
    damage: 0,
    effectType: 'buff',
    color: new THREE.Color(0x00ff99),
    rarity: 'rare',
    buffType: 'lifesteal',
    buffDuration: 15000,
    buffValue: 25 // 生命偷取25%
  },
  {
    id: 'critical_focus',
    name: '写轮眼·洞察',
    seals: ['雷印', '火印'],
    chakraCost: 35,
    cooldown: 25000,
    damage: 0,
    effectType: 'buff',
    color: new THREE.Color(0xff0000),
    rarity: 'epic',
    buffType: 'critical',
    buffDuration: 12000,
    buffValue: 50 // 暴击率+50%
  },
  {
    id: 'combo_master',
    name: '连击精通',
    seals: ['风印', '雷印', '风印'],
    chakraCost: 50,
    cooldown: 30000,
    damage: 0,
    effectType: 'buff',
    color: new THREE.Color(0xffcc00),
    rarity: 'epic',
    buffType: 'combo',
    buffDuration: 20000,
    buffValue: 100 // 连击加成+100%
  },

  // ========== v181新增：风遁强化忍术 ==========
  {
    id: 'wind_devastation',
    name: '风遁·风尘乱舞',
    seals: ['风印', '风印', '风印'],
    chakraCost: 85,
    cooldown: 12000,
    damage: 180,
    effectType: 'area',
    color: new THREE.Color(0x98fb98),
    rarity: 'legendary',
    aoeRadius: 12,
    chainCount: 5
  },
  {
    id: 'wind_vacuum',
    name: '风遁·真空波',
    seals: ['风印', '土印'],
    chakraCost: 40,
    cooldown: 4000,
    damage: 55,
    effectType: 'projectile',
    color: new THREE.Color(0xc0ffc0),
    rarity: 'rare',
    bonusDamage: 25
  },
  {
    id: 'wind_gale_palace',
    name: '风遁·风神掌',
    seals: ['风印', '雷印', '土印'],
    chakraCost: 70,
    cooldown: 8000,
    damage: 120,
    effectType: 'area',
    color: new THREE.Color(0x7fff00),
    rarity: 'epic',
    aoeRadius: 10,
    bonusDamage: 50
  },
  {
    id: 'wind_scythe',
    name: '风遁·镰鼬之风',
    seals: ['风印', '风印'],
    chakraCost: 30,
    cooldown: 3500,
    damage: 45,
    effectType: 'projectile',
    color: new THREE.Color(0xadff2f),
    rarity: 'rare',
    criticalChance: 20
  },

  // ========== v181新增：土遁强化忍术 ==========
  {
    id: 'earth_spear',
    name: '土遁·土矛',
    seals: ['土印', '土印'],
    chakraCost: 25,
    cooldown: 2500,
    damage: 50,
    effectType: 'projectile',
    color: new THREE.Color(0xcd853f),
    rarity: 'rare',
    bonusDamage: 20
  },
  {
    id: 'earth_swamp',
    name: '土遁·沼陷之术',
    seals: ['土印', '水印'],
    chakraCost: 45,
    cooldown: 10000,
    damage: 30,
    effectType: 'debuff',
    color: new THREE.Color(0x556b2f),
    rarity: 'epic',
    buffType: 'speed',
    buffDuration: 8000,
    buffValue: -50, // 减速敌人
    aoeRadius: 15
  },
  {
    id: 'earth_mountain',
    name: '土遁·土陆大军',
    seals: ['土印', '土印', '土印'],
    chakraCost: 80,
    cooldown: 15000,
    damage: 200,
    effectType: 'area',
    color: new THREE.Color(0x8b4513),
    rarity: 'legendary',
    aoeRadius: 18,
    bonusDamage: 100
  },
  {
    id: 'earth_dragon_bullet',
    name: '土遁·土龙弹',
    seals: ['土印', '火印', '土印'],
    chakraCost: 60,
    cooldown: 7000,
    damage: 100,
    effectType: 'projectile',
    color: new THREE.Color(0xd2691e),
    rarity: 'epic',
    bonusDamage: 60,
    aoeRadius: 5
  },
  {
    id: 'earth_shield_ultimate',
    name: '土遁·大地护盾',
    seals: ['土印', '风印', '土印'],
    chakraCost: 55,
    cooldown: 20000,
    damage: 0,
    effectType: 'shield',
    color: new THREE.Color(0xdaa520),
    rarity: 'legendary',
    buffType: 'defense',
    buffDuration: 15000,
    buffValue: 90
  },

  // ========== v181新增：风土组合忍术 ==========
  {
    id: 'dust_storm',
    name: '风遁·尘遁·原界剥离',
    seals: ['风印', '土印', '风印', '土印'],
    chakraCost: 100,
    cooldown: 20000,
    damage: 350,
    effectType: 'ultimate',
    color: new THREE.Color(0xfff8dc),
    rarity: 'mythic',
    aoeRadius: 20,
    bonusDamage: 150
  }
];
