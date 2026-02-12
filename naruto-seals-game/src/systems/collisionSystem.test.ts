import { describe, test, expect } from 'vitest';
import { isColliding, applyDamage, applyHitEffect, calculateScreenShake } from './collisionSystem';
import * as THREE from 'three';
import type { Enemy } from './enemySpawner';

describe('CollisionSystem - 碰撞和打击反馈', () => {
  describe('isColliding - 碰撞检测', () => {
    test('距离<1时判定碰撞', () => {
      const pos1 = new THREE.Vector3(5, 0, 0);
      const pos2 = new THREE.Vector3(5.5, 0, 0);
      expect(isColliding(pos1, pos2, 1)).toBe(true);
    });

    test('距离=1时判定碰撞（边界）', () => {
      const pos1 = new THREE.Vector3(0, 0, 0);
      const pos2 = new THREE.Vector3(1, 0, 0);
      expect(isColliding(pos1, pos2, 1)).toBe(true);
    });

    test('距离>1时不碰撞', () => {
      const pos1 = new THREE.Vector3(0, 0, 0);
      const pos2 = new THREE.Vector3(2, 0, 0);
      expect(isColliding(pos1, pos2, 1)).toBe(false);
    });

    test('支持自定义碰撞半径', () => {
      const pos1 = new THREE.Vector3(0, 0, 0);
      const pos2 = new THREE.Vector3(1.5, 0, 0);
      expect(isColliding(pos1, pos2, 2)).toBe(true);
    });
  });

  describe('applyDamage - 伤害计算', () => {
    const mockEnemy: Enemy = {
      id: 'test',
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(-5, 0, 0),
      health: 3,
      maxHealth: 3,
      size: 1,
      wave: 1
    };

    test('敌人受到伤害后减血', () => {
      const newHealth = applyDamage(mockEnemy, 1);
      expect(newHealth).toBe(2);
    });

    test('伤害不会使血量为负', () => {
      const enemy = { ...mockEnemy, health: 1 };
      const newHealth = applyDamage(enemy, 10);
      expect(newHealth).toBe(0);
      expect(newHealth).toBeGreaterThanOrEqual(0);
    });

    test('0伤害不改变血量', () => {
      const newHealth = applyDamage(mockEnemy, 0);
      expect(newHealth).toBe(3);
    });
  });

  describe('applyHitEffect - 打击反馈', () => {
    const mockEnemy: Enemy = {
      id: 'test',
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(-5, 0, 0),
      health: 3,
      maxHealth: 3,
      size: 1,
      wave: 1
    };

    test('敌人被击中时闪白', () => {
      const effect = applyHitEffect(mockEnemy);
      expect(effect.flash).toBe(true);
      expect(effect.flashDuration).toBeGreaterThan(0);
    });

    test('闪白持续时间约0.1秒', () => {
      const effect = applyHitEffect(mockEnemy);
      expect(effect.flashDuration).toBeCloseTo(0.1, 2);
    });

    test('返回敌人ID用于追踪', () => {
      const effect = applyHitEffect(mockEnemy);
      expect(effect.enemyId).toBe('test');
    });
  });

  describe('calculateScreenShake - 屏幕震动', () => {
    test('伤害越高震动越强', () => {
      const shake1 = calculateScreenShake(1);
      const shake3 = calculateScreenShake(3);
      expect(shake3.amplitude).toBeGreaterThan(shake1.amplitude);
    });

    test('震动幅度不超过0.5', () => {
      const shake = calculateScreenShake(100);
      expect(shake.amplitude).toBeLessThanOrEqual(0.5);
    });

    test('震动持续时间约0.2-0.5秒', () => {
      const shake = calculateScreenShake(3);
      expect(shake.duration).toBeGreaterThan(0);
      expect(shake.duration).toBeLessThan(1);
    });
  });
});
