import type { SealType } from '../types';

/**
 * 印记序列管理类
 * 用于管理玩家结印的序列，支持添加、移除、清空等操作
 */
export class SealSequence {
  private seals: SealType[] = [];
  private maxLength: number;

  constructor(options?: { maxLength?: number }) {
    this.maxLength = options?.maxLength ?? 3;
  }

  /**
   * 添加印记到序列
   * 如果已满则忽略
   */
  add(seal: SealType): void {
    if (this.seals.length < this.maxLength) {
      this.seals.push(seal);
    }
  }

  /**
   * 清空所有印记
   */
  clear(): void {
    this.seals = [];
  }

  /**
   * 移除最后一个印记（撤销）
   * @returns 被移除的印记，如果序列为空则返回undefined
   */
  remove(): SealType | undefined {
    return this.seals.pop();
  }

  /**
   * 获取印记序列的副本
   * @returns 印记数组的副本
   */
  getSeals(): SealType[] {
    return [...this.seals];
  }

  /**
   * 获取序列长度
   */
  length(): number {
    return this.seals.length;
  }

  /**
   * 判断序列是否已满
   */
  isFull(): boolean {
    return this.seals.length >= this.maxLength;
  }

  /**
   * 判断序列是否为空
   */
  isEmpty(): boolean {
    return this.seals.length === 0;
  }
}
