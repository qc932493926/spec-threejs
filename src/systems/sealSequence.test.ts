import { describe, test, expect, beforeEach } from 'vitest';
import { SealSequence } from './sealSequence';

describe('SealSequence - 印记序列管理', () => {
  let sequence: SealSequence;

  beforeEach(() => {
    sequence = new SealSequence();
  });

  test('初始化时序列为空', () => {
    expect(sequence.length()).toBe(0);
    expect(sequence.isEmpty()).toBe(true);
    expect(sequence.getSeals()).toEqual([]);
  });

  test('添加印记到序列', () => {
    sequence.add('火印');
    expect(sequence.length()).toBe(1);
    expect(sequence.getSeals()).toEqual(['火印']);
  });

  test('添加多个印记', () => {
    sequence.add('火印');
    sequence.add('水印');
    sequence.add('雷印');
    expect(sequence.length()).toBe(3);
    expect(sequence.getSeals()).toEqual(['火印', '水印', '雷印']);
  });

  test('默认最多3个印记', () => {
    sequence.add('火印');
    sequence.add('水印');
    sequence.add('雷印');
    sequence.add('风印'); // 应该被忽略
    expect(sequence.length()).toBe(3);
    expect(sequence.isFull()).toBe(true);
  });

  test('自定义最大长度', () => {
    const customSeq = new SealSequence({ maxLength: 5 });
    customSeq.add('火印');
    customSeq.add('水印');
    customSeq.add('雷印');
    customSeq.add('风印');
    customSeq.add('土印');
    expect(customSeq.length()).toBe(5);
    expect(customSeq.isFull()).toBe(true);
  });

  test('清空序列', () => {
    sequence.add('火印');
    sequence.add('水印');
    sequence.clear();
    expect(sequence.length()).toBe(0);
    expect(sequence.isEmpty()).toBe(true);
  });

  test('移除最后一个印记', () => {
    sequence.add('火印');
    sequence.add('水印');
    sequence.add('雷印');

    const removed = sequence.remove();
    expect(removed).toBe('雷印');
    expect(sequence.length()).toBe(2);
    expect(sequence.getSeals()).toEqual(['火印', '水印']);
  });

  test('空序列移除返回undefined', () => {
    const removed = sequence.remove();
    expect(removed).toBeUndefined();
  });

  test('getSeals返回副本而非引用', () => {
    sequence.add('火印');
    const seals1 = sequence.getSeals();
    seals1.push('水印'); // 修改副本
    const seals2 = sequence.getSeals();
    expect(seals2).toEqual(['火印']); // 原序列未受影响
  });
});
