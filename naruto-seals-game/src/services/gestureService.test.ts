import { describe, test, expect } from 'vitest';
import { detectNinjaSeal, getSealType, type NormalizedLandmark } from './gestureService';

describe('GestureService - detectNinjaSeal', () => {
  test('识别张开手掌为Open_Palm', () => {
    // Mock landmarks for open palm (fingers extended)
    const landmarks: NormalizedLandmark[] = [
      { x: 0.5, y: 0.5, z: 0 },    // palm center
      ...Array.from({ length: 20 }, (_, i) => ({
        x: 0.5 + (i % 4) * 0.1,   // spread out fingers
        y: 0.5 - (i % 5) * 0.05,
        z: 0
      }))
    ];

    const result = detectNinjaSeal(landmarks);
    expect(result).toBe('Open_Palm');
  });

  test('识别握拳为Closed_Fist', () => {
    // Mock landmarks for closed fist (fingers close to palm)
    const landmarks: NormalizedLandmark[] = [
      { x: 0.5, y: 0.5, z: 0 },    // palm center
      ...Array.from({ length: 20 }, (_, i) => ({
        x: 0.5 + 0.02,  // fingers close to palm
        y: 0.5 + 0.02,
        z: 0
      }))
    ];

    const result = detectNinjaSeal(landmarks);
    expect(result).toBe('Closed_Fist');
  });

  test('无效landmarks返回None', () => {
    const result = detectNinjaSeal([]);
    expect(result).toBe('None');
  });

  test('landmarks少于21个返回None', () => {
    const landmarks: NormalizedLandmark[] = Array.from({ length: 10 }, () => ({
      x: 0, y: 0, z: 0
    }));

    const result = detectNinjaSeal(landmarks);
    expect(result).toBe('None');
  });
});

describe('GestureService - getSealType', () => {
  test('映射Open_Palm到火印', () => {
    expect(getSealType('Open_Palm')).toBe('火印');
  });

  test('映射Closed_Fist到水印', () => {
    expect(getSealType('Closed_Fist')).toBe('水印');
  });

  test('映射Pointing_Up到雷印', () => {
    expect(getSealType('Pointing_Up')).toBe('雷印');
  });

  test('映射Thumb_Up到风印', () => {
    expect(getSealType('Thumb_Up')).toBe('风印');
  });

  test('映射Victory到土印', () => {
    expect(getSealType('Victory')).toBe('土印');
  });

  test('未识别手势返回null', () => {
    expect(getSealType('None')).toBe(null);
  });
});
