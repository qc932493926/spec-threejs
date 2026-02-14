import { describe, test, expect } from 'vitest';
import { matchJutsu, canReleaseJutsu, releaseJutsu, type GameState } from './jutsuSystem';
import type { Jutsu } from '../types';

describe('JutsuSystem - 忍术系统', () => {
  describe('matchJutsu - 匹配忍术', () => {
    test('单一火印匹配火遁', () => {
      const jutsu = matchJutsu(['火印']);
      expect(jutsu).toBeDefined();
      expect(jutsu?.name).toBe('火遁·豪火球之术');
      expect(jutsu?.damage).toBe(30);
    });

    test('单一水印匹配水遁', () => {
      const jutsu = matchJutsu(['水印']);
      expect(jutsu).toBeDefined();
      expect(jutsu?.name).toBe('水遁·水龙弹之术');
    });

    test('单一雷印匹配雷遁', () => {
      const jutsu = matchJutsu(['雷印']);
      expect(jutsu).toBeDefined();
      expect(jutsu?.name).toBe('雷遁·千鸟');
      expect(jutsu?.damage).toBe(50);
    });

    test('组合印记匹配火雷组合', () => {
      const jutsu = matchJutsu(['火印', '雷印']);
      expect(jutsu).toBeDefined();
      expect(jutsu?.name).toBe('火遁·龙火之术');
      expect(jutsu?.damage).toBe(80);
      expect(jutsu?.effectType).toBe('area');
    });

    test('空序列返回null', () => {
      const jutsu = matchJutsu([]);
      expect(jutsu).toBeNull();
    });

    test('无效序列返回null', () => {
      const jutsu = matchJutsu(['火印', '水印']); // 无此组合
      expect(jutsu).toBeNull();
    });
  });

  describe('canReleaseJutsu - 检查是否能释放', () => {
    const mockJutsu: Jutsu = {
      id: 'test',
      name: '测试忍术',
      seals: ['火印'],
      chakraCost: 20,
      cooldown: 1000,
      damage: 30,
      effectType: 'projectile',
      color: { r: 1, g: 0, b: 0 } as any
    };

    test('查克拉足够可以释放', () => {
      const gameState: GameState = { chakra: 100, maxChakra: 100 };
      expect(canReleaseJutsu(gameState, mockJutsu)).toBe(true);
    });

    test('查克拉刚好够可以释放', () => {
      const gameState: GameState = { chakra: 20, maxChakra: 100 };
      expect(canReleaseJutsu(gameState, mockJutsu)).toBe(true);
    });

    test('查克拉不足不能释放', () => {
      const gameState: GameState = { chakra: 10, maxChakra: 100 };
      expect(canReleaseJutsu(gameState, mockJutsu)).toBe(false);
    });

    test('查克拉为0不能释放', () => {
      const gameState: GameState = { chakra: 0, maxChakra: 100 };
      expect(canReleaseJutsu(gameState, mockJutsu)).toBe(false);
    });
  });

  describe('releaseJutsu - 释放忍术', () => {
    const mockJutsu: Jutsu = {
      id: 'test',
      name: '测试忍术',
      seals: ['火印'],
      chakraCost: 20,
      cooldown: 1000,
      damage: 30,
      effectType: 'projectile',
      color: { r: 1, g: 0, b: 0 } as any
    };

    test('释放忍术消耗查克拉', () => {
      const gameState: GameState = { chakra: 100, maxChakra: 100 };
      const newState = releaseJutsu(gameState, mockJutsu);

      expect(newState.chakra).toBe(80); // 100 - 20
    });

    test('释放后查克拉不会为负', () => {
      const gameState: GameState = { chakra: 10, maxChakra: 100 };
      const newState = releaseJutsu(gameState, mockJutsu);

      expect(newState.chakra).toBeGreaterThanOrEqual(0);
    });

    test('释放不影响maxChakra', () => {
      const gameState: GameState = { chakra: 100, maxChakra: 100 };
      const newState = releaseJutsu(gameState, mockJutsu);

      expect(newState.maxChakra).toBe(100);
    });

    test('返回新状态而非修改原状态（不可变性）', () => {
      const gameState: GameState = { chakra: 100, maxChakra: 100 };
      const newState = releaseJutsu(gameState, mockJutsu);

      expect(gameState.chakra).toBe(100); // 原状态未变
      expect(newState.chakra).toBe(80);   // 新状态已变
      expect(newState).not.toBe(gameState); // 不同对象
    });
  });
});
