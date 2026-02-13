import { describe, test, expect, beforeEach } from 'vitest';
import { EnemySpawner, createEnemy, getWaveConfig } from './enemySpawner';
import * as THREE from 'three';

describe('EnemySpawner - 弹幕式敌人生成器', () => {
  describe('createEnemy - 创建敌人', () => {
    test('敌人从右侧生成（x >= 14）', () => {
      const enemy = createEnemy({ wave: 1 });
      expect(enemy.position.x).toBeGreaterThanOrEqual(14);
    });

    test('敌人向左移动（velocity.x < 0）', () => {
      const enemy = createEnemy({ wave: 1 });
      expect(enemy.velocity.x).toBeLessThan(0);
    });

    test('敌人在Y轴随机位置生成', () => {
      const enemies = Array.from({ length: 10 }, () => createEnemy({ wave: 1 }));
      const yPositions = enemies.map(e => e.position.y);
      const hasVariety = yPositions.some(y => y !== yPositions[0]);
      expect(hasVariety).toBe(true); // 不是所有Y都相同
    });

    test('wave 1敌人速度约为5', () => {
      const enemy = createEnemy({ wave: 1 });
      const speed = Math.abs(enemy.velocity.x);
      expect(speed).toBeCloseTo(5, 1);
    });

    test('wave 3敌人速度约为7', () => {
      const enemy = createEnemy({ wave: 3 });
      const speed = Math.abs(enemy.velocity.x);
      expect(speed).toBeCloseTo(7, 1);
    });

    test('敌人有血量', () => {
      const enemy = createEnemy({ wave: 1 });
      expect(enemy.health).toBeGreaterThan(0);
    });

    test('高波次敌人血量更多', () => {
      const enemy1 = createEnemy({ wave: 1 });
      const enemy3 = createEnemy({ wave: 3 });
      expect(enemy3.health).toBeGreaterThanOrEqual(enemy1.health);
    });
  });

  describe('getWaveConfig - 波次配置', () => {
    test('wave 1配置', () => {
      const config = getWaveConfig(1);
      expect(config.enemyCount).toBe(10);
      expect(config.speed).toBe(5);
      expect(config.health).toBe(1);
      expect(config.interval).toBe(2);
    });

    test('wave 2配置速度递增', () => {
      const config = getWaveConfig(2);
      expect(config.speed).toBe(6);
    });

    test('wave 3配置血量增加', () => {
      const config = getWaveConfig(3);
      expect(config.health).toBe(2);
    });

    test('boss wave配置', () => {
      const config = getWaveConfig(5);
      expect(config.health).toBeGreaterThan(20);
      expect(config.size).toBeGreaterThan(3);
    });
  });

  describe('EnemySpawner - 生成器', () => {
    let spawner: EnemySpawner;

    beforeEach(() => {
      spawner = new EnemySpawner({ wave: 1 });
    });

    test('初始化不立即生成敌人', () => {
      expect(spawner.shouldSpawn()).toBe(false);
    });

    test('经过interval时间后应该生成', () => {
      spawner.update(2.1); // wave 1 interval=2
      expect(spawner.shouldSpawn()).toBe(true);
    });

    test('生成后计时器重置', () => {
      spawner.update(2.1);
      spawner.spawn();
      expect(spawner.shouldSpawn()).toBe(false);
    });

    test('未达到interval不生成', () => {
      spawner.update(1.0);
      expect(spawner.shouldSpawn()).toBe(false);
    });

    test('spawn()返回敌人实体', () => {
      spawner.update(2.1);
      const enemy = spawner.spawn();
      expect(enemy).toBeDefined();
      expect(enemy.position).toBeInstanceOf(THREE.Vector3);
      expect(enemy.velocity).toBeInstanceOf(THREE.Vector3);
    });

    test('达到maxCount时不生成', () => {
      const limitedSpawner = new EnemySpawner({ wave: 1, maxCount: 2 });
      const currentEnemies = [{ id: '1' }, { id: '2' }];

      expect(limitedSpawner.canSpawn(currentEnemies)).toBe(false);
    });

    test('未达到maxCount可生成', () => {
      const limitedSpawner = new EnemySpawner({ wave: 1, maxCount: 4 });
      const currentEnemies = [{ id: '1' }, { id: '2' }];

      expect(limitedSpawner.canSpawn(currentEnemies)).toBe(true);
    });
  });
});
