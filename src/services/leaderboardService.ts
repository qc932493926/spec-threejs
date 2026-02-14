// 排行榜记录
export interface LeaderboardEntry {
  name: string;
  score: number;
  wave: number;
  combo: number;
  date: string;
}

const LEADERBOARD_KEY = 'naruto_leaderboard';
const MAX_ENTRIES = 10;

class LeaderboardService {
  private entries: LeaderboardEntry[] = [];

  constructor() {
    this.loadFromStorage();
  }

  // 添加新记录
  addEntry(entry: Omit<LeaderboardEntry, 'date'>): number {
    const newEntry: LeaderboardEntry = {
      ...entry,
      date: new Date().toLocaleDateString('zh-CN'),
    };

    this.entries.push(newEntry);
    this.entries.sort((a, b) => b.score - a.score);

    // 只保留前10名
    if (this.entries.length > MAX_ENTRIES) {
      this.entries = this.entries.slice(0, MAX_ENTRIES);
    }

    this.saveToStorage();

    // 返回排名（1-based）
    return this.entries.findIndex(e => e === newEntry) + 1;
  }

  // 获取排行榜
  getLeaderboard(): LeaderboardEntry[] {
    return [...this.entries];
  }

  // 检查是否是新纪录
  isNewRecord(score: number): boolean {
    if (this.entries.length < MAX_ENTRIES) return true;
    return score > this.entries[this.entries.length - 1].score;
  }

  // 获取最高分
  getHighScore(): number {
    return this.entries.length > 0 ? this.entries[0].score : 0;
  }

  // 清除排行榜
  clear() {
    this.entries = [];
    localStorage.removeItem(LEADERBOARD_KEY);
  }

  // 保存到localStorage
  private saveToStorage() {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.entries));
    } catch (e) {
      console.error('Failed to save leaderboard:', e);
    }
  }

  // 从localStorage加载
  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(LEADERBOARD_KEY);
      if (saved) {
        this.entries = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
      this.entries = [];
    }
  }
}

export const leaderboardService = new LeaderboardService();
