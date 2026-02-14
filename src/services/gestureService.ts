import * as THREE from 'three';
import type { GestureType, NormalizedLandmark, SealType } from '../types/index.ts';
import { gestureMapping } from '../types/index.ts';

/**
 * v177: 增强版手势识别服务
 * 添加手势置信度、历史记录滤波、抗抖动等功能
 */

// 手势识别结果（带置信度）
export interface GestureResult {
  type: GestureType;
  confidence: number;
  sealType: SealType | null;
}

// 手势历史记录
interface GestureHistoryEntry {
  type: GestureType;
  timestamp: number;
  confidence: number;
}

// 平滑滤波器
class SmoothFilter {
  private history: THREE.Vector2[] = [];
  private windowSize = 5;

  smooth(newPosition: THREE.Vector2): THREE.Vector2 {
    this.history.push(newPosition.clone());
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // 加权平均
    const sum = new THREE.Vector2();
    let totalWeight = 0;

    this.history.forEach((pos, i) => {
      const weight = (i + 1) / this.history.length;
      sum.add(pos.clone().multiplyScalar(weight));
      totalWeight += weight;
    });

    return sum.divideScalar(totalWeight);
  }

  reset() {
    this.history = [];
  }
}

// 手势稳定性检测器
class GestureStabilityDetector {
  private history: GestureHistoryEntry[] = [];
  private readonly historySize = 10;
  private readonly stabilityThreshold = 0.7;

  addGesture(type: GestureType, confidence: number): void {
    this.history.push({
      type,
      timestamp: Date.now(),
      confidence,
    });

    if (this.history.length > this.historySize) {
      this.history.shift();
    }
  }

  /**
   * 检测当前手势是否稳定
   * 只有在历史记录中大部分都是同一手势时才认为稳定
   */
  getStableGesture(): GestureType | null {
    if (this.history.length < 3) return null;

    // 统计最近的手势
    const recentGestures = this.history.slice(-5);
    const gestureCounts: Record<string, number> = {};
    let totalConfidence = 0;

    recentGestures.forEach(entry => {
      gestureCounts[entry.type] = (gestureCounts[entry.type] || 0) + entry.confidence;
      totalConfidence += entry.confidence;
    });

    // 找出最常见的手势
    let maxCount = 0;
    let stableGesture: GestureType | null = null;

    Object.entries(gestureCounts).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        stableGesture = type as GestureType;
      }
    });

    // 检查稳定性阈值
    if (stableGesture && maxCount / totalConfidence > this.stabilityThreshold) {
      return stableGesture;
    }

    return null;
  }

  reset(): void {
    this.history = [];
  }
}

// 手势置信度计算器
class GestureConfidenceCalculator {
  /**
   * 计算手指展开度
   */
  calculateFingerSpread(landmarks: NormalizedLandmark[]): number {
    const fingers = [
      landmarks[8],  // 食指
      landmarks[12], // 中指
      landmarks[16], // 无名指
      landmarks[20], // 小指
    ];

    const palm = landmarks[0];
    let totalDistance = 0;

    fingers.forEach(finger => {
      totalDistance += Math.hypot(finger.x - palm.x, finger.y - palm.y);
    });

    return totalDistance / fingers.length;
  }

  /**
   * 计算手指是否伸直
   */
  isFingerExtended(landmarks: NormalizedLandmark[], fingerTip: number, fingerPip: number, fingerMcp: number): boolean {
    const tip = landmarks[fingerTip];
    const pip = landmarks[fingerPip];
    const mcp = landmarks[fingerMcp];

    // 检查三个关键点是否在一条直线上（允许一定误差）
    const v1 = { x: pip.x - mcp.x, y: pip.y - mcp.y };
    const v2 = { x: tip.x - pip.x, y: tip.y - pip.y };

    // 计算角度
    const angle = Math.abs(Math.atan2(v2.y, v2.x) - Math.atan2(v1.y, v1.x));

    // 如果角度接近0或PI，说明手指是直的
    return angle < 0.3 || angle > Math.PI - 0.3;
  }

  /**
   * 计算手掌朝向
   */
  calculatePalmOrientation(landmarks: NormalizedLandmark[]): 'up' | 'down' | 'side' {
    const wrist = landmarks[0];
    const middleMcp = landmarks[9];

    // 通过手腕和中指根部的相对位置判断朝向
    if (middleMcp.y < wrist.y - 0.05) {
      return 'up';
    } else if (middleMcp.y > wrist.y + 0.05) {
      return 'down';
    }
    return 'side';
  }

  /**
   * 计算手势的置信度
   */
  calculateConfidence(landmarks: NormalizedLandmark[], gestureType: GestureType): number {
    if (!landmarks || landmarks.length < 21) return 0;

    const palm = landmarks[0];
    const fingerSpread = this.calculateFingerSpread(landmarks);

    let confidence = 0;

    switch (gestureType) {
      case 'Open_Palm': {
        // 检查所有手指是否伸直
        const indexExtended = this.isFingerExtended(landmarks, 8, 6, 5);
        const middleExtended = this.isFingerExtended(landmarks, 12, 10, 9);
        const ringExtended = this.isFingerExtended(landmarks, 16, 14, 13);
        const pinkyExtended = this.isFingerExtended(landmarks, 20, 18, 17);

        const extendedCount = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length;
        confidence = (extendedCount / 4) * (fingerSpread / 0.2);
        break;
      }

      case 'Closed_Fist': {
        // 检查所有手指是否弯曲
        const fingerCurl = 1 - (fingerSpread / 0.2);
        confidence = Math.max(0, Math.min(1, fingerCurl));
        break;
      }

      case 'Pointing_Up': {
        const indexExtended = this.isFingerExtended(landmarks, 8, 6, 5);
        const othersCurled = !this.isFingerExtended(landmarks, 12, 10, 9) &&
                            !this.isFingerExtended(landmarks, 16, 14, 13) &&
                            !this.isFingerExtended(landmarks, 20, 18, 17);

        confidence = (indexExtended ? 0.6 : 0) + (othersCurled ? 0.4 : 0);
        break;
      }

      case 'Thumb_Up': {
        const thumb = landmarks[4];
        const thumbUp = thumb.y < palm.y - 0.1;
        const fingersCurled = fingerSpread < 0.08;

        confidence = (thumbUp ? 0.6 : 0) + (fingersCurled ? 0.4 : 0);
        break;
      }

      case 'Victory': {
        const indexExtended = this.isFingerExtended(landmarks, 8, 6, 5);
        const middleExtended = this.isFingerExtended(landmarks, 12, 10, 9);
        const ringCurled = !this.isFingerExtended(landmarks, 16, 14, 13);
        const pinkyCurled = !this.isFingerExtended(landmarks, 20, 18, 17);

        confidence = (indexExtended && middleExtended ? 0.5 : 0) +
                    (ringCurled && pinkyCurled ? 0.5 : 0);
        break;
      }

      default:
        confidence = 0;
    }

    return Math.max(0, Math.min(1, confidence));
  }
}

// 导出实例
export const smoothFilter = new SmoothFilter();
export const stabilityDetector = new GestureStabilityDetector();
export const confidenceCalculator = new GestureConfidenceCalculator();

/**
 * v177增强版：检测手势类型（带置信度）
 */
export function detectNinjaSealWithConfidence(landmarks: NormalizedLandmark[]): GestureResult {
  if (!landmarks || landmarks.length < 21) {
    return { type: 'None', confidence: 0, sealType: null };
  }

  const fingers = [
    landmarks[8],  // 食指
    landmarks[12], // 中指
    landmarks[16], // 无名指
    landmarks[20]  // 小指
  ];

  const palm = landmarks[0];
  const thumb = landmarks[4];
  const indexTip = landmarks[8];

  // 计算手指展开度
  const fingerDistance = fingers.reduce((sum, finger) => {
    const dist = Math.hypot(finger.x - palm.x, finger.y - palm.y);
    return sum + dist;
  }, 0) / fingers.length;

  // 计算各手势的特征值
  const features = {
    fingerSpread: fingerDistance,
    indexExtended: indexTip.y < palm.y - 0.08,
    middleExtended: landmarks[12].y < palm.y - 0.08,
    ringExtended: landmarks[16].y < palm.y - 0.05,
    pinkyExtended: landmarks[20].y < palm.y - 0.05,
    thumbUp: thumb.y < palm.y - 0.08,
  };

  // 使用改进的规则进行手势识别
  let gestureType: GestureType = 'None';
  let maxScore = 0;

  // Open_Palm检测
  if (fingerDistance > 0.12) {
    const score = fingerDistance / 0.2;
    if (score > maxScore) {
      maxScore = score;
      gestureType = 'Open_Palm';
    }
  }

  // Closed_Fist检测
  if (fingerDistance < 0.06) {
    const score = 1 - (fingerDistance / 0.06);
    if (score > maxScore) {
      maxScore = score;
      gestureType = 'Closed_Fist';
    }
  }

  // Pointing_Up检测
  const pointingScore = calculatePointingScore(landmarks, features);
  if (pointingScore > maxScore) {
    maxScore = pointingScore;
    gestureType = 'Pointing_Up';
  }

  // Thumb_Up检测
  if (features.thumbUp && fingerDistance < 0.1) {
    const score = 0.7 + (features.thumbUp ? 0.3 : 0);
    if (score > maxScore) {
      maxScore = score;
      gestureType = 'Thumb_Up';
    }
  }

  // Victory检测
  const victoryScore = calculateVictoryScore(landmarks, features);
  if (victoryScore > maxScore) {
    maxScore = victoryScore;
    gestureType = 'Victory';
  }

  // 计算最终置信度
  const confidence = confidenceCalculator.calculateConfidence(landmarks, gestureType);

  // 添加到稳定性检测器
  stabilityDetector.addGesture(gestureType, confidence);

  // 获取稳定的手势
  const stableGesture = stabilityDetector.getStableGesture();

  // 如果当前手势不稳定，返回None
  if (confidence < 0.5) {
    return { type: 'None', confidence, sealType: null };
  }

  return {
    type: stableGesture || gestureType,
    confidence,
    sealType: gestureMapping[stableGesture || gestureType],
  };
}

/**
 * 计算Pointing_Up手势得分
 */
function calculatePointingScore(_landmarks: NormalizedLandmark[], features: any): number {
  if (!features.indexExtended) return 0;

  let score = 0.5; // 基础分

  // 食指伸直程度
  if (features.indexExtended) score += 0.2;

  // 其他手指弯曲程度
  if (!features.middleExtended && !features.ringExtended && !features.pinkyExtended) {
    score += 0.3;
  }

  return score;
}

/**
 * 计算Victory手势得分
 */
function calculateVictoryScore(_landmarks: NormalizedLandmark[], features: any): number {
  if (!features.indexExtended || !features.middleExtended) return 0;

  let score = 0.4; // 基础分

  // 食指和中指伸直
  if (features.indexExtended && features.middleExtended) score += 0.3;

  // 无名指和小指弯曲
  if (!features.ringExtended && !features.pinkyExtended) score += 0.3;

  return score;
}

/**
 * 原版兼容：检测手势类型
 */
export function detectNinjaSeal(landmarks: NormalizedLandmark[]): GestureType {
  const result = detectNinjaSealWithConfidence(landmarks);
  return result.type;
}

/**
 * 获取手势对应的手印类型
 */
export function getSealType(gestureType: GestureType): SealType | null {
  return gestureMapping[gestureType];
}

/**
 * 获取手部中心位置（归一化坐标）
 */
export function getHandCenter(landmarks: NormalizedLandmark[]): THREE.Vector2 {
  if (!landmarks || landmarks.length < 21) {
    return new THREE.Vector2(0.5, 0.5);
  }

  // 使用手掌和各指根部的平均值作为中心
  const palm = landmarks[0];
  const fingerBases = [
    landmarks[5],  // 食指根部
    landmarks[9],  // 中指根部
    landmarks[13], // 无名指根部
    landmarks[17], // 小指根部
  ];

  let sumX = palm.x;
  let sumY = palm.y;

  fingerBases.forEach(base => {
    sumX += base.x;
    sumY += base.y;
  });

  return new THREE.Vector2(sumX / 5, sumY / 5);
}

/**
 * 将归一化坐标映射到3D世界坐标
 */
export function mapGestureToWorldCoords(
  gestureX: number,
  gestureY: number,
  camera: THREE.Camera,
  distance: number = 10
): THREE.Vector3 {
  // 转换到NDC
  const x = (gestureX * 2) - 1;
  const y = -(gestureY * 2) + 1;

  // 从屏幕空间投射到3D世界
  const vector = new THREE.Vector3(x, y, 0.5);
  vector.unproject(camera);

  // 计算方向
  const dir = vector.sub(camera.position).normalize();

  return camera.position.clone().add(dir.multiplyScalar(distance));
}

/**
 * 计算两个关键点之间的距离
 */
export function getDistance(p1: NormalizedLandmark, p2: NormalizedLandmark): number {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
}

/**
 * 检测捏合手势
 */
export function detectPinch(landmarks: NormalizedLandmark[]): boolean {
  if (!landmarks || landmarks.length < 21) {
    return false;
  }

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const distance = getDistance(thumbTip, indexTip);
  return distance < 0.05;
}

/**
 * 重置所有滤波器和检测器
 */
export function resetGestureDetection(): void {
  smoothFilter.reset();
  stabilityDetector.reset();
}

/**
 * 获取手势的详细信息（用于调试）
 */
export function getGestureDebugInfo(landmarks: NormalizedLandmark[]): {
  fingerSpread: number;
  palmOrientation: string;
  fingerStates: Record<string, boolean>;
} {
  if (!landmarks || landmarks.length < 21) {
    return {
      fingerSpread: 0,
      palmOrientation: 'unknown',
      fingerStates: {},
    };
  }

  const fingerSpread = confidenceCalculator.calculateFingerSpread(landmarks);
  const palmOrientation = confidenceCalculator.calculatePalmOrientation(landmarks);

  const fingerStates = {
    indexExtended: confidenceCalculator.isFingerExtended(landmarks, 8, 6, 5),
    middleExtended: confidenceCalculator.isFingerExtended(landmarks, 12, 10, 9),
    ringExtended: confidenceCalculator.isFingerExtended(landmarks, 16, 14, 13),
    pinkyExtended: confidenceCalculator.isFingerExtended(landmarks, 20, 18, 17),
  };

  return {
    fingerSpread,
    palmOrientation,
    fingerStates,
  };
}
