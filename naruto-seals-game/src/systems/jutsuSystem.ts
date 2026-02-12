import type { SealType, Jutsu } from '../types';
import { jutsuList } from '../types';

/**
 * 游戏状态接口（简化版，只包含忍术系统需要的字段）
 */
export interface GameState {
  chakra: number;
  maxChakra: number;
}

/**
 * 根据印记序列匹配对应的忍术
 * @param seals 印记序列
 * @returns 匹配的忍术，如果没有匹配则返回null
 */
export function matchJutsu(seals: SealType[]): Jutsu | null {
  if (seals.length === 0) {
    return null;
  }

  // 优先匹配组合技（长序列优先）
  const sortedJutsuList = [...jutsuList].sort((a, b) => b.seals.length - a.seals.length);

  for (const jutsu of sortedJutsuList) {
    // 检查印记序列是否完全匹配
    if (jutsu.seals.length === seals.length) {
      const allMatch = jutsu.seals.every((seal, index) => seal === seals[index]);
      if (allMatch) {
        return jutsu;
      }
    }
  }

  return null;
}

/**
 * 检查是否有足够的查克拉释放忍术
 * @param gameState 游戏状态
 * @param jutsu 要释放的忍术
 * @returns 是否可以释放
 */
export function canReleaseJutsu(gameState: GameState, jutsu: Jutsu): boolean {
  return gameState.chakra >= jutsu.chakraCost;
}

/**
 * 释放忍术，消耗查克拉
 * @param gameState 当前游戏状态
 * @param jutsu 要释放的忍术
 * @returns 新的游戏状态（不可变更新）
 */
export function releaseJutsu(gameState: GameState, jutsu: Jutsu): GameState {
  const newChakra = Math.max(0, gameState.chakra - jutsu.chakraCost);

  return {
    ...gameState,
    chakra: newChakra
  };
}
