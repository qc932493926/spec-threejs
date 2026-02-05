import * as THREE from 'three';

// 手势类型
export type SealType = 'fire' | 'water' | 'thunder' | 'wind' | 'earth';
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
  'Open_Palm': 'fire',
  'Closed_Fist': 'water',
  'Pointing_Up': 'thunder',
  'Thumb_Up': 'wind',
  'Victory': 'earth',
  'None': null
};

// 手势Emoji
export const sealEmojis: Record<SealType, string> = {
  fire: '🔥',
  water: '💧',
  thunder: '⚡',
  wind: '💨',
  earth: '🗿'
};

// 预定义忍术
export const jutsuList: Jutsu[] = [
  {
    id: 'fireball',
    name: '火遁·豪火球之术',
    seals: ['fire'],
    chakraCost: 20,
    cooldown: 1000,
    damage: 30,
    effectType: 'projectile',
    color: new THREE.Color(0xff4500)
  },
  {
    id: 'water_dragon',
    name: '水遁·水龙弹之术',
    seals: ['water'],
    chakraCost: 25,
    cooldown: 1500,
    damage: 35,
    effectType: 'projectile',
    color: new THREE.Color(0x1e90ff)
  },
  {
    id: 'lightning',
    name: '雷遁·雷切',
    seals: ['thunder'],
    chakraCost: 30,
    cooldown: 2000,
    damage: 50,
    effectType: 'projectile',
    color: new THREE.Color(0x00ffff)
  },
  {
    id: 'wind_blade',
    name: '风遁·风切',
    seals: ['wind'],
    chakraCost: 15,
    cooldown: 800,
    damage: 25,
    effectType: 'projectile',
    color: new THREE.Color(0x90ee90)
  },
  {
    id: 'earth_wall',
    name: '土遁·土流壁',
    seals: ['earth'],
    chakraCost: 40,
    cooldown: 3000,
    damage: 0,
    effectType: 'shield',
    color: new THREE.Color(0x8b4513)
  },
  {
    id: 'fire_thunder_combo',
    name: '火雷爆发',
    seals: ['fire', 'thunder'],
    chakraCost: 50,
    cooldown: 3000,
    damage: 80,
    effectType: 'area',
    color: new THREE.Color(0xff6600)
  }
];
