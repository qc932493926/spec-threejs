/**
 * v174-v179: 存档系统服务
 * 使用localStorage保存和加载游戏进度
 * v179新增：多存档槽位、自动备份、完整性校验
 */

// 存档数据接口
export interface SaveData {
  version: string;
  timestamp: number;
  slotId: number; // v179: 存档槽位ID
  slotName: string; // v179: 存档名称
  checksum: string; // v179: 数据校验和
  playerStats: PlayerStats;
  settings: GameSettings;
  achievements: UnlockedAchievement[];
  jutsuUpgrades: JutsuUpgradeState;
  tutorialProgress: TutorialProgress;
  dailyChallenges: DailyChallengeState; // v183: 每日挑战状态
}

// 玩家统计数据
export interface PlayerStats {
  totalScore: number;
  highScore: number;
  maxCombo: number;
  maxWave: number;
  totalKills: number;
  totalGamesPlayed: number;
  totalPlayTime: number; // 秒
  jutsuUsedCount: Record<string, number>;
  bossKills: number;
  perfectWaves: number;
}

// 游戏设置
export interface GameSettings {
  volume: number;
  musicVolume: number;
  sfxVolume: number;
  difficulty: 'easy' | 'normal' | 'hard';
  quality: 'low' | 'medium' | 'high';
  language: string;
  showTutorial: boolean;
  showFPS: boolean;
  gameSpeed: number;
}

// 已解锁成就
export interface UnlockedAchievement {
  id: string;
  unlockedAt: number;
}

// 忍术升级状态 (v178)
export interface JutsuUpgradeState {
  [jutsuId: string]: {
    level: number;
    experience: number;
  };
}

// 教程进度
export interface TutorialProgress {
  completed: boolean;
  completedSteps: number[];
  advancedTutorialCompleted: boolean;
}

// v183: 每日挑战状态
export interface DailyChallengeState {
  lastRefreshDate: string;
  completedChallenges: string[];
  progress: Record<string, number>;
}

// 存档键名
const SAVE_KEY = 'naruto_seals_save';
const SETTINGS_KEY = 'naruto_seals_settings';
const STATS_KEY = 'naruto_seals_stats';
const SLOTS_KEY = 'naruto_seals_slots'; // v179: 多存档槽位
const BACKUP_KEY = 'naruto_seals_backup'; // v179: 自动备份
const MAX_SLOTS = 5; // v179: 最大存档槽位数

// 默认玩家统计
const DEFAULT_PLAYER_STATS: PlayerStats = {
  totalScore: 0,
  highScore: 0,
  maxCombo: 0,
  maxWave: 1,
  totalKills: 0,
  totalGamesPlayed: 0,
  totalPlayTime: 0,
  jutsuUsedCount: {},
  bossKills: 0,
  perfectWaves: 0,
};

// 默认游戏设置
const DEFAULT_GAME_SETTINGS: GameSettings = {
  volume: 70,
  musicVolume: 80,
  sfxVolume: 100,
  difficulty: 'normal',
  quality: 'high',
  language: 'zh-CN',
  showTutorial: true,
  showFPS: false,
  gameSpeed: 1.0,
};

// 默认教程进度
const DEFAULT_TUTORIAL_PROGRESS: TutorialProgress = {
  completed: false,
  completedSteps: [],
  advancedTutorialCompleted: false,
};

// v183: 默认每日挑战状态
const DEFAULT_DAILY_CHALLENGE_STATE: DailyChallengeState = {
  lastRefreshDate: '',
  completedChallenges: [],
  progress: {},
};

/**
 * 存档服务类
 */
class SaveService {
  private currentSave: SaveData | null = null;
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;
  private backupInterval: ReturnType<typeof setInterval> | null = null; // v179: 自动备份定时器
  private currentSlotId: number = 0; // v179: 当前使用的存档槽位

  /**
   * 初始化存档系统
   */
  initialize(): void {
    this.loadSave();
    this.startAutoSave();
    this.startAutoBackup(); // v179: 启动自动备份
  }

  // ==================== v179: 多存档槽位系统 ====================

  /**
   * 获取所有存档槽位
   */
  getAllSlots(): SaveData[] {
    try {
      const slotsData = localStorage.getItem(SLOTS_KEY);
      if (slotsData) {
        return JSON.parse(slotsData) as SaveData[];
      }
    } catch (error) {
      console.error('Failed to load slots:', error);
    }
    return [];
  }

  /**
   * 获取存档槽位信息（不含完整数据）
   */
  getSlotInfo(): Array<{ slotId: number; slotName: string; timestamp: number; playTime: number; highScore: number }> {
    const slots = this.getAllSlots();
    return slots.map(slot => ({
      slotId: slot.slotId,
      slotName: slot.slotName,
      timestamp: slot.timestamp,
      playTime: slot.playerStats.totalPlayTime,
      highScore: slot.playerStats.highScore,
    }));
  }

  /**
   * 选择存档槽位
   */
  selectSlot(slotId: number): boolean {
    if (slotId < 0 || slotId >= MAX_SLOTS) {
      return false;
    }

    const slots = this.getAllSlots();
    const slot = slots.find(s => s.slotId === slotId);

    if (slot && this.verifyChecksum(slot)) {
      this.currentSave = slot;
      this.currentSlotId = slotId;
      return true;
    }

    // 槽位不存在或校验失败，创建新存档
    this.currentSlotId = slotId;
    this.createNewSave();
    return true;
  }

  /**
   * 创建新存档到指定槽位
   */
  createNewSaveAtSlot(slotId: number, slotName?: string): SaveData {
    const newSave: SaveData = {
      version: '1.79.0',
      timestamp: Date.now(),
      slotId,
      slotName: slotName || `存档 ${slotId + 1}`,
      checksum: '',
      playerStats: { ...DEFAULT_PLAYER_STATS },
      settings: { ...DEFAULT_GAME_SETTINGS },
      achievements: [],
      jutsuUpgrades: {},
      tutorialProgress: { ...DEFAULT_TUTORIAL_PROGRESS },
      dailyChallenges: { ...DEFAULT_DAILY_CHALLENGE_STATE },
    };
    newSave.checksum = this.calculateChecksum(newSave);

    this.currentSave = newSave;
    this.currentSlotId = slotId;
    this.saveToSlot();
    return newSave;
  }

  /**
   * 保存到当前槽位
   */
  saveToSlot(): void {
    if (!this.currentSave) return;

    this.currentSave.timestamp = Date.now();
    this.currentSave.checksum = this.calculateChecksum(this.currentSave);

    let slots = this.getAllSlots();
    const existingIndex = slots.findIndex(s => s.slotId === this.currentSlotId);

    if (existingIndex >= 0) {
      slots[existingIndex] = this.currentSave;
    } else {
      slots.push(this.currentSave);
      slots.sort((a, b) => a.slotId - b.slotId);
    }

    try {
      localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.currentSave)); // 同时更新主存档
    } catch (error) {
      console.error('Failed to save slot:', error);
    }
  }

  /**
   * 删除存档槽位
   */
  deleteSlot(slotId: number): boolean {
    let slots = this.getAllSlots();
    const index = slots.findIndex(s => s.slotId === slotId);

    if (index >= 0) {
      slots.splice(index, 1);
      try {
        localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
        return true;
      } catch (error) {
        console.error('Failed to delete slot:', error);
      }
    }
    return false;
  }

  // ==================== v179: 校验和计算 ====================

  /**
   * 计算存档校验和
   */
  private calculateChecksum(save: SaveData): string {
    const dataToHash = JSON.stringify({
      version: save.version,
      timestamp: save.timestamp,
      slotId: save.slotId,
      playerStats: save.playerStats,
      achievements: save.achievements,
      jutsuUpgrades: save.jutsuUpgrades,
    });

    // 简单的哈希算法
    let hash = 0;
    for (let i = 0; i < dataToHash.length; i++) {
      const char = dataToHash.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `v1_${Math.abs(hash).toString(16)}`;
  }

  /**
   * 验证存档校验和
   */
  verifyChecksum(save: SaveData): boolean {
    if (!save.checksum) return false;
    const calculated = this.calculateChecksum(save);
    return calculated === save.checksum;
  }

  // ==================== v179: 自动备份系统 ====================

  /**
   * 启动自动备份
   */
  private startAutoBackup(): void {
    // 每5分钟自动备份一次
    this.backupInterval = setInterval(() => {
      this.createBackup();
    }, 300000);
  }

  /**
   * 创建备份
   */
  createBackup(): void {
    if (!this.currentSave) return;

    try {
      const backupData = {
        timestamp: Date.now(),
        save: this.currentSave,
      };
      localStorage.setItem(BACKUP_KEY, JSON.stringify(backupData));
    } catch (error) {
      console.error('Failed to create backup:', error);
    }
  }

  /**
   * 从备份恢复
   */
  restoreFromBackup(): boolean {
    try {
      const backupData = localStorage.getItem(BACKUP_KEY);
      if (backupData) {
        const backup = JSON.parse(backupData);
        if (backup.save && this.verifyChecksum(backup.save)) {
          this.currentSave = backup.save;
          this.currentSlotId = backup.save.slotId;
          this.saveToStorage();
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
    }
    return false;
  }

  /**
   * 获取备份信息
   */
  getBackupInfo(): { timestamp: number; exists: boolean } {
    try {
      const backupData = localStorage.getItem(BACKUP_KEY);
      if (backupData) {
        const backup = JSON.parse(backupData);
        return { timestamp: backup.timestamp, exists: true };
      }
    } catch (error) {
      // 忽略
    }
    return { timestamp: 0, exists: false };
  }

  /**
   * 停止自动备份
   */
  stopAutoBackup(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
    }
  }

  /**
   * 获取当前存档
   */
  getCurrentSave(): SaveData | null {
    return this.currentSave;
  }

  /**
   * 创建新存档
   */
  createNewSave(): SaveData {
    const newSave: SaveData = {
      version: '1.79.0',
      timestamp: Date.now(),
      slotId: this.currentSlotId,
      slotName: `存档 ${this.currentSlotId + 1}`,
      checksum: '',
      playerStats: { ...DEFAULT_PLAYER_STATS },
      settings: { ...DEFAULT_GAME_SETTINGS },
      achievements: [],
      jutsuUpgrades: {},
      tutorialProgress: { ...DEFAULT_TUTORIAL_PROGRESS },
      dailyChallenges: { ...DEFAULT_DAILY_CHALLENGE_STATE },
    };
    newSave.checksum = this.calculateChecksum(newSave);
    this.currentSave = newSave;
    this.saveToStorage();
    this.saveToSlot();
    return newSave;
  }

  /**
   * 从localStorage加载存档
   */
  loadSave(): SaveData | null {
    try {
      const savedData = localStorage.getItem(SAVE_KEY);
      if (savedData) {
        const parsed = JSON.parse(savedData) as SaveData;
        // 验证存档版本并迁移旧数据
        this.currentSave = this.migrateSaveData(parsed);
        return this.currentSave;
      }
    } catch (error) {
      console.error('Failed to load save data:', error);
    }
    return null;
  }

  /**
   * 保存到localStorage
   */
  saveToStorage(): void {
    if (!this.currentSave) return;

    try {
      this.currentSave.timestamp = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.currentSave));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }

  /**
   * 更新玩家统计
   */
  updatePlayerStats(updates: Partial<PlayerStats>): void {
    if (!this.currentSave) {
      this.createNewSave();
    }

    this.currentSave!.playerStats = {
      ...this.currentSave!.playerStats,
      ...updates,
    };

    // 更新最高分
    if (updates.highScore && updates.highScore > this.currentSave!.playerStats.highScore) {
      this.currentSave!.playerStats.highScore = updates.highScore;
    }

    // 更新最大连击
    if (updates.maxCombo && updates.maxCombo > this.currentSave!.playerStats.maxCombo) {
      this.currentSave!.playerStats.maxCombo = updates.maxCombo;
    }

    // 更新最高波次
    if (updates.maxWave && updates.maxWave > this.currentSave!.playerStats.maxWave) {
      this.currentSave!.playerStats.maxWave = updates.maxWave;
    }

    this.saveToStorage();
  }

  /**
   * 更新游戏设置
   */
  updateSettings(updates: Partial<GameSettings>): void {
    if (!this.currentSave) {
      this.createNewSave();
    }

    this.currentSave!.settings = {
      ...this.currentSave!.settings,
      ...updates,
    };

    this.saveToStorage();
    // 同时保存到单独的设置键
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.currentSave!.settings));
  }

  /**
   * 获取游戏设置
   */
  getSettings(): GameSettings {
    if (this.currentSave) {
      return this.currentSave.settings;
    }

    // 尝试从单独的设置键加载
    try {
      const settingsData = localStorage.getItem(SETTINGS_KEY);
      if (settingsData) {
        return JSON.parse(settingsData) as GameSettings;
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    return { ...DEFAULT_GAME_SETTINGS };
  }

  /**
   * 解锁成就
   */
  unlockAchievement(achievementId: string): boolean {
    if (!this.currentSave) {
      this.createNewSave();
    }

    // 检查是否已解锁
    if (this.currentSave!.achievements.some(a => a.id === achievementId)) {
      return false;
    }

    this.currentSave!.achievements.push({
      id: achievementId,
      unlockedAt: Date.now(),
    });

    this.saveToStorage();
    return true;
  }

  /**
   * 检查成就是否已解锁
   */
  isAchievementUnlocked(achievementId: string): boolean {
    if (!this.currentSave) return false;
    return this.currentSave.achievements.some(a => a.id === achievementId);
  }

  /**
   * 获取所有已解锁成就
   */
  getUnlockedAchievements(): UnlockedAchievement[] {
    if (!this.currentSave) return [];
    return this.currentSave.achievements;
  }

  /**
   * 更新忍术升级状态
   */
  updateJutsuUpgrade(jutsuId: string, level: number, experience: number): void {
    if (!this.currentSave) {
      this.createNewSave();
    }

    this.currentSave!.jutsuUpgrades[jutsuId] = { level, experience };
    this.saveToStorage();
  }

  /**
   * 获取忍术升级状态
   */
  getJutsuUpgrade(jutsuId: string): { level: number; experience: number } | null {
    if (!this.currentSave) return null;
    return this.currentSave.jutsuUpgrades[jutsuId] || null;
  }

  /**
   * 更新教程进度
   */
  updateTutorialProgress(updates: Partial<TutorialProgress>): void {
    if (!this.currentSave) {
      this.createNewSave();
    }

    this.currentSave!.tutorialProgress = {
      ...this.currentSave!.tutorialProgress,
      ...updates,
    };

    this.saveToStorage();
  }

  /**
   * 获取教程进度
   */
  getTutorialProgress(): TutorialProgress {
    if (!this.currentSave) {
      return { ...DEFAULT_TUTORIAL_PROGRESS };
    }
    return this.currentSave.tutorialProgress;
  }

  /**
   * 记录忍术使用
   */
  recordJutsuUse(jutsuId: string): void {
    if (!this.currentSave) {
      this.createNewSave();
    }

    const currentCount = this.currentSave!.playerStats.jutsuUsedCount[jutsuId] || 0;
    this.currentSave!.playerStats.jutsuUsedCount[jutsuId] = currentCount + 1;
    this.saveToStorage();
  }

  /**
   * 增加游戏时间
   */
  addPlayTime(seconds: number): void {
    if (!this.currentSave) return;
    this.currentSave.playerStats.totalPlayTime += seconds;
  }

  /**
   * 获取玩家统计
   */
  getPlayerStats(): PlayerStats {
    if (this.currentSave) {
      return this.currentSave.playerStats;
    }

    // 尝试从单独的统计键加载
    try {
      const statsData = localStorage.getItem(STATS_KEY);
      if (statsData) {
        return JSON.parse(statsData) as PlayerStats;
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }

    return { ...DEFAULT_PLAYER_STATS };
  }

  /**
   * 清除所有存档
   */
  clearAllData(): void {
    localStorage.removeItem(SAVE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(SLOTS_KEY); // v179
    localStorage.removeItem(BACKUP_KEY); // v179
    this.currentSave = null;
  }

  // ==================== v179: 导入导出增强 ====================

  /**
   * 导出存档数据（带格式化）
   */
  exportSaveFormatted(): string {
    if (!this.currentSave) {
      return '';
    }
    const exportData = {
      game: 'naruto-seals-game',
      version: '1.79.0',
      exportDate: new Date().toISOString(),
      save: this.currentSave,
    };
    return btoa(encodeURIComponent(JSON.stringify(exportData)));
  }

  /**
   * 导入存档数据（带验证）
   */
  importSaveFormatted(encodedData: string): { success: boolean; error?: string } {
    try {
      const decoded = decodeURIComponent(atob(encodedData));
      const data = JSON.parse(decoded);

      if (data.game !== 'naruto-seals-game') {
        return { success: false, error: '无效的存档文件' };
      }

      const saveData = data.save as SaveData;
      this.currentSave = this.migrateSaveData(saveData);
      this.currentSlotId = saveData.slotId;
      this.saveToStorage();
      this.saveToSlot();
      return { success: true };
    } catch (error) {
      return { success: false, error: '存档解析失败' };
    }
  }

  /**
   * 获取当前存档槽位ID
   */
  getCurrentSlotId(): number {
    return this.currentSlotId;
  }

  /**
   * 获取最大槽位数
   */
  getMaxSlots(): number {
    return MAX_SLOTS;
  }

  /**
   * 导出存档数据
   */
  exportSave(): string {
    if (!this.currentSave) {
      return '';
    }
    return btoa(JSON.stringify(this.currentSave));
  }

  /**
   * 导入存档数据
   */
  importSave(encodedData: string): boolean {
    try {
      const decoded = atob(encodedData);
      const data = JSON.parse(decoded) as SaveData;
      this.currentSave = this.migrateSaveData(data);
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }

  /**
   * 迁移旧版本存档数据
   */
  private migrateSaveData(save: SaveData): SaveData {
    // 确保所有字段都存在
    const migrated: SaveData = {
      version: save.version || '1.79.0',
      timestamp: save.timestamp || Date.now(),
      slotId: save.slotId ?? this.currentSlotId,
      slotName: save.slotName || `存档 ${(save.slotId ?? this.currentSlotId) + 1}`,
      checksum: '',
      playerStats: {
        ...DEFAULT_PLAYER_STATS,
        ...save.playerStats,
      },
      settings: {
        ...DEFAULT_GAME_SETTINGS,
        ...save.settings,
      },
      achievements: save.achievements || [],
      jutsuUpgrades: save.jutsuUpgrades || {},
      tutorialProgress: {
        ...DEFAULT_TUTORIAL_PROGRESS,
        ...save.tutorialProgress,
      },
      dailyChallenges: {
        ...DEFAULT_DAILY_CHALLENGE_STATE,
        ...save.dailyChallenges,
      },
    };

    // 计算新的校验和
    migrated.checksum = this.calculateChecksum(migrated);
    return migrated;
  }

  /**
   * 启动自动保存
   */
  private startAutoSave(): void {
    // 每30秒自动保存一次
    this.autoSaveInterval = setInterval(() => {
      if (this.currentSave) {
        this.saveToStorage();
      }
    }, 30000);
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  /**
   * 格式化游戏时间
   */
  formatPlayTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }
}

// 导出单例
export const saveService = new SaveService();
