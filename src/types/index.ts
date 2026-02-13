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
  effectType: 'projectile' | 'area' | 'shield';
  color: THREE.Color;
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
  // 基础忍术
  {
    id: 'fireball',
    name: '火遁·豪火球之术',
    seals: ['火印'],
    chakraCost: 20,
    cooldown: 1000,
    damage: 30,
    effectType: 'projectile',
    color: new THREE.Color(0xff4500)
  },
  {
    id: 'water_dragon',
    name: '水遁·水龙弹之术',
    seals: ['水印'],
    chakraCost: 25,
    cooldown: 1500,
    damage: 35,
    effectType: 'projectile',
    color: new THREE.Color(0x1e90ff)
  },
  {
    id: 'lightning',
    name: '雷遁·千鸟',
    seals: ['雷印'],
    chakraCost: 30,
    cooldown: 2000,
    damage: 50,
    effectType: 'projectile',
    color: new THREE.Color(0x00ffff)
  },
  {
    id: 'wind_blade',
    name: '风遁·螺旋手里剑',
    seals: ['风印'],
    chakraCost: 15,
    cooldown: 800,
    damage: 25,
    effectType: 'projectile',
    color: new THREE.Color(0x90ee90)
  },
  {
    id: 'earth_wall',
    name: '土遁·土流壁',
    seals: ['土印'],
    chakraCost: 40,
    cooldown: 3000,
    damage: 0,
    effectType: 'shield',
    color: new THREE.Color(0x8b4513)
  },
  // 组合忍术
  {
    id: 'fire_thunder_combo',
    name: '火遁·龙火之术',
    seals: ['火印', '雷印'],
    chakraCost: 50,
    cooldown: 3000,
    damage: 80,
    effectType: 'area',
    color: new THREE.Color(0xff6600)
  },
  {
    id: 'water_wind_combo',
    name: '水遁·暴风水龙弹',
    seals: ['水印', '风印'],
    chakraCost: 45,
    cooldown: 2500,
    damage: 70,
    effectType: 'projectile',
    color: new THREE.Color(0x4169e1)
  },
  {
    id: 'earth_fire_combo',
    name: '火遁·炎弹',
    seals: ['土印', '火印'],
    chakraCost: 55,
    cooldown: 3500,
    damage: 90,
    effectType: 'area',
    color: new THREE.Color(0xff8c00)
  },
  {
    id: 'thunder_water_combo',
    name: '雷遁·雷水龙弹',
    seals: ['雷印', '水印'],
    chakraCost: 60,
    cooldown: 4000,
    damage: 100,
    effectType: 'projectile',
    color: new THREE.Color(0x7b68ee)
  }
];
