import * as THREE from 'three';
import type { Enemy } from './enemySpawner';

/**
 * 打击特效接口
 */
export interface HitEffect {
  enemyId: string;
  flash: boolean;
  flashDuration: number;
}

/**
 * 屏幕震动接口
 */
export interface ScreenShake {
  amplitude: number;  // 震动幅度
  duration: number;   // 持续时间（秒）
}

/**
 * 碰撞检测
 * @param pos1 第一个物体位置
 * @param pos2 第二个物体位置
 * @param threshold 碰撞阈值（距离）
 * @returns 是否碰撞
 */
export function isColliding(pos1: THREE.Vector3, pos2: THREE.Vector3, threshold: number = 1): boolean {
  const distance = pos1.distanceTo(pos2);
  return distance <= threshold;
}

/**
 * 应用伤害
 * @param enemy 敌人实体
 * @param damage 伤害值
 * @returns 新的血量
 */
export function applyDamage(enemy: Enemy, damage: number): number {
  return Math.max(0, enemy.health - damage);
}

/**
 * 应用打击特效
 * @param enemy 敌人实体
 * @returns 打击特效配置
 */
export function applyHitEffect(enemy: Enemy): HitEffect {
  return {
    enemyId: enemy.id,
    flash: true,
    flashDuration: 0.1
  };
}

/**
 * 计算屏幕震动
 * @param damage 伤害值
 * @returns 屏幕震动配置
 */
export function calculateScreenShake(damage: number): ScreenShake {
  // 基于伤害计算震动幅度，最大0.5
  const amplitude = Math.min(0.5, damage * 0.05);

  // 震动持续时间0.2-0.5秒
  const duration = Math.min(0.5, 0.2 + damage * 0.02);

  return {
    amplitude,
    duration
  };
}
