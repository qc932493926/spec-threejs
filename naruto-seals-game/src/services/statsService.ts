/**
 * v184: 游戏统计服务
 * 提供详细的游戏数据统计和分析
 */

import { saveService, type PlayerStats } from './saveService';

/**
 * 统计数据接口
 */
export interface GameStatistics {
  // 基础统计
  totalGamesPlayed: number;
  totalPlayTime: number;
  totalScore: number;
  highScore: number;

  // 战斗统计
  totalKills: number;
  maxCombo: number;
  maxWave: number;
  bossKills: number;
  perfectWaves: number;

  // 忍术统计
  totalJutsuUsed: number;
  favoriteJutsu: string;
  jutsuAccuracy: number;

  // 效率统计
  averageScore: number;
  averageKillsPerGame: number;
  killsPerMinute: number;

  // 成就统计
  achievementsUnlocked: number;
  achievementsTotal: number;
  achievementProgress: number;

  // 排名
  leaderboardRank: number;
}

/**
 * 统计服务类
 */
class StatsService {
  /**
   * 获取完整统计数据
   */
  getStatistics(): GameStatistics {
    const stats = saveService.getPlayerStats();
    // 预留设置相关统计
    // const settings = saveService.getSettings();

    return {
      // 基础统计
      totalGamesPlayed: stats.totalGamesPlayed,
      totalPlayTime: stats.totalPlayTime,
      totalScore: stats.totalScore,
      highScore: stats.highScore,

      // 战斗统计
      totalKills: stats.totalKills,
      maxCombo: stats.maxCombo,
      maxWave: stats.maxWave,
      bossKills: stats.bossKills,
      perfectWaves: stats.perfectWaves,

      // 忍术统计
      totalJutsuUsed: this.getTotalJutsuUsed(stats),
      favoriteJutsu: this.getFavoriteJutsu(stats),
      jutsuAccuracy: this.calculateJutsuAccuracy(stats),

      // 效率统计
      averageScore: this.calculateAverageScore(stats),
      averageKillsPerGame: this.calculateAverageKills(stats),
      killsPerMinute: this.calculateKillsPerMinute(stats),

      // 成就统计
      achievementsUnlocked: saveService.getUnlockedAchievements().length,
      achievementsTotal: 20, // 总成就数
      achievementProgress: 0, // 由外部计算

      // 排名
      leaderboardRank: 0, // 由外部计算
    };
  }

  /**
   * 获取总忍术使用次数
   */
  private getTotalJutsuUsed(stats: PlayerStats): number {
    return Object.values(stats.jutsuUsedCount).reduce((sum, count) => sum + count, 0);
  }

  /**
   * 获取最常用的忍术
   */
  private getFavoriteJutsu(stats: PlayerStats): string {
    const entries = Object.entries(stats.jutsuUsedCount);
    if (entries.length === 0) return '无';

    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }

  /**
   * 计算忍术命中率
   */
  private calculateJutsuAccuracy(stats: PlayerStats): number {
    const totalJutsu = this.getTotalJutsuUsed(stats);
    if (totalJutsu === 0) return 0;

    // 简单估算：基于击杀数
    const estimatedHits = Math.min(stats.totalKills, totalJutsu);
    return Math.round((estimatedHits / totalJutsu) * 100);
  }

  /**
   * 计算平均分数
   */
  private calculateAverageScore(stats: PlayerStats): number {
    if (stats.totalGamesPlayed === 0) return 0;
    return Math.round(stats.totalScore / stats.totalGamesPlayed);
  }

  /**
   * 计算平均击杀数
   */
  private calculateAverageKills(stats: PlayerStats): number {
    if (stats.totalGamesPlayed === 0) return 0;
    return Math.round(stats.totalKills / stats.totalGamesPlayed);
  }

  /**
   * 计算每分钟击杀数
   */
  private calculateKillsPerMinute(stats: PlayerStats): number {
    if (stats.totalPlayTime === 0) return 0;
    return Math.round((stats.totalKills / stats.totalPlayTime) * 60);
  }

  /**
   * 格式化游戏时间
   */
  formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}小时 ${minutes}分钟`;
    } else if (minutes > 0) {
      return `${minutes}分钟`;
    } else {
      return `${seconds}秒`;
    }
  }

  /**
   * 获取统计数据摘要（用于UI显示）
   */
  getSummary(): string[] {
    const stats = this.getStatistics();
    return [
      `总游戏次数: ${stats.totalGamesPlayed}`,
      `总游戏时长: ${this.formatPlayTime(stats.totalPlayTime)}`,
      `最高分: ${stats.highScore}`,
      `最高连击: ${stats.maxCombo}x`,
      `最高波次: ${stats.maxWave}`,
      `总击杀数: ${stats.totalKills}`,
      `Boss击杀: ${stats.bossKills}`,
    ];
  }

  /**
   * 获取效率报告
   */
  getEfficiencyReport(): string[] {
    const stats = this.getStatistics();
    return [
      `平均分数: ${stats.averageScore}`,
      `平均击杀: ${stats.averageKillsPerGame}/局`,
      `击杀效率: ${stats.killsPerMinute}/分钟`,
      `忍术命中率: ${stats.jutsuAccuracy}%`,
    ];
  }
}

// 导出单例
export const statsService = new StatsService();
